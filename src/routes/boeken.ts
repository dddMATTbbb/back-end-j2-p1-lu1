import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ObjectId } from "mongodb";
import {db, db as postgresDb} from "../prisma/db.ts";
import { boekenLijstSchema, paginatedBoekenSchema, ruwBoekSchema, foutSchema } from '../schemas/boeken.ts';

type BoekenQuery = {
    Querystring: {
        zoekTerm?: string,
        boekId?: string,
        taalNiveau?: string,
        genre?: string,
        onderwerp?: string,
        page?: number | string,
        limit?: number | string,
    };
};

export async function boekenRoutes(fastify: FastifyInstance) {
    const mongoDb = fastify.mongo.client.db('j1-p1-lu1');
    const boekenCollection = mongoDb.collection('boeken');

    // Hulpfunctie om speciale regex-tekens veilig te escapen
    function escapeRegex(text: string) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    async function getBooks(
        request: FastifyRequest<BoekenQuery>,
        reply: FastifyReply
    ) {
        const { zoekTerm, genre, onderwerp, taalNiveau } = request.query;
        const page = Math.max(1, Number(request.query.page) || 1);
        const limit = Math.max(1, Number(request.query.limit) || 20);
        const skip = (page - 1) * limit;
        const userId = request.user?.id;

        try {
            // 1. Haal de bestaande leeslijst status op uit PostgreSQL
            const userLeesLijst = new Map<string, { isRead: boolean }>();
            if (userId) {
                for await (const row of postgresDb.orm.public.LeesLijst.where({ studentId: userId }).all()) {
                    userLeesLijst.set(row.boekId, { isRead: Boolean(row.isRead) });
                }
            }

            // 2. Bouw dynamisch de matchConditions op met de juiste MongoDB-veldnamen
            const matchConditions: Record<string, any> = {};

            if (taalNiveau?.trim()) {
                matchConditions['Niveau'] = taalNiveau.trim();
            }

            if (genre?.trim()) {
                // Exacte match of regex voor Type materiaal (bijv. "Boek")
                matchConditions['Type materiaal'] = { $regex: `^${escapeRegex(genre.trim())}$`, $options: 'i' };
            }

            if (onderwerp?.trim()) {
                // Zoekt naar het onderwerp als losstaand thema tussen puntkomma's (bijv. "oorlog;verlies")
                const safeOnderwerp = escapeRegex(onderwerp.trim());
                matchConditions['Themas_boek'] = {
                    $regex: `(^|;)\\s*${safeOnderwerp}(\\s*;|$)`,
                    $options: 'i'
                };
            }

            fastify.log.info(matchConditions['Niveau']);
            fastify.log.info(matchConditions['Type materiaal']);
            fastify.log.info(matchConditions['Themas_boek']);

            let rawBoeken: any[] = [];
            let total = 0;

            if (!zoekTerm?.trim()) {
                // SCENARIO 1: Geen zoekterm -> als matchConditions leeg is ({}), haalt hij alle boeken gepagineerd op
                total = await boekenCollection.countDocuments(matchConditions);
                rawBoeken = await boekenCollection.find(matchConditions).skip(skip).limit(limit).toArray();
            } else {
                // SCENARIO 2: Wel een zoekterm -> Atlas Search
                try {
                    const countPipeline: any[] = [
                        {
                            $search: {
                                index: 'default',
                                text: {
                                    query: zoekTerm,
                                    path: ['Titel', 'Auteur'],
                                    fuzzy: { maxEdits: 1, prefixLength: 2 }
                                },
                            }
                        }
                    ];
                    if (Object.keys(matchConditions).length > 0) {
                        countPipeline.push({ $match: matchConditions });
                    }
                    countPipeline.push({ $count: 'total' });
                    const countResult = await boekenCollection.aggregate(countPipeline).toArray();
                    total = countResult[0]?.total ?? 0;

                    const pipeline: any[] = [
                        {
                            $search: {
                                index: 'default',
                                text: {
                                    query: zoekTerm,
                                    path: ['Titel', 'Auteur'],
                                    fuzzy: { maxEdits: 1, prefixLength: 2 }
                                },
                            }
                        }
                    ];

                    if (Object.keys(matchConditions).length > 0) {
                        pipeline.push({ $match: matchConditions });
                    }

                    pipeline.push({ $skip: skip });
                    pipeline.push({ $limit: limit });
                    rawBoeken = await boekenCollection.aggregate(pipeline).toArray();

                } catch (Err) {
                    fastify.log.error(Err);
                    // FALLBACK: Regex fallback bij indexproblemen
                    const fallbackQuery: Record<string, any> = { ...matchConditions };
                    fallbackQuery.$or = [
                        { Titel: { $regex: zoekTerm, $options: 'i' } },
                        { Auteur: { $regex: zoekTerm, $options: 'i' } },
                    ];

                    total = await boekenCollection.countDocuments(fallbackQuery);
                    rawBoeken = await boekenCollection.find(fallbackQuery).skip(skip).limit(limit).toArray();
                }
            }

            // 3. Map de resultaten naar het gewenste formaat
            const boeken = rawBoeken.map((b) => {
                const bookId = b._id ? b._id.toString() : (b.id ? b.id.toString() : '');
                const entry = userLeesLijst.get(bookId);
                return {
                    id: bookId,
                    _id: bookId,
                    Titel: b.Titel,
                    titel: b.Titel,
                    Auteur: b.Auteur,
                    auteur: b.Auteur,
                    Omschrijving: b['Korte omschrijving'] || b.Omschrijving || '',
                    'Korte omschrijving': b['Korte omschrijving'] || b.Omschrijving || '',
                    Niveau: b.Niveau || '',
                    taalNiveau: b.Niveau || '',
                    Themas: b.Themas_boek || b.Themas || '',
                    Themas_boek: b.Themas_boek || b.Themas || '',
                    'Type materiaal': b['Type materiaal'] || '',
                    isBookmarked: Boolean(entry),
                    isRead: entry ? entry.isRead : false,
                };
            });

            const totalPages = Math.ceil(total / limit) || 1;

            return reply.status(200).send({
                boeken,
                total,
                page,
                limit,
                totalPages,
            });
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Database query mislukt' });
        }
    }

    async function getBook(request: FastifyRequest<BoekenQuery>, reply: FastifyReply) {
        const { boekId } = request.query as { boekId?: string };

        if (!boekId) {
            return reply.status(400).send({ message: "no boek id found" });
        }

        try {
            const boekIdObject = new ObjectId(boekId);
            const boek = await boekenCollection.findOne({ _id: boekIdObject });
            if (!boek) {
                return reply.status(404).send({ message: "Boek niet gevonden" });
            }

            return reply.status(200).send(boek);
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Database query mislukt' });
        }
    }

    async function getPersonolizedBooks(request:FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;

        try{
            const leesProfiel = await db.orm.public.LeesProfiel.where({studentId: userId}).first()

            const StatusBoek = new Map<string, { isRead: boolean }>();
            if (userId) {
                for await (const row of postgresDb.orm.public.LeesLijst.where({ studentId: userId }).all()) {
                    StatusBoek.set(row.boekId, { isRead: Boolean(row.isRead) });
                }
            }

            if (!leesProfiel) {
                return reply.status(404).send({ message: "LeesProfiel niet gevonden" });
            }



            const rawBoeken = await boekenCollection.find({"Type materiaal": leesProfiel.favorieteTypeMatariaal}).limit(3).toArray();

            const boeken = rawBoeken.map((b) => {
                const bookId = b._id ? b._id.toString() : (b.id ? b.id.toString() : '');
                const entry = StatusBoek.get(bookId);
                return {
                    id: bookId,
                    _id: bookId,
                    Titel: b.Titel,
                    titel: b.Titel,
                    Auteur: b.Auteur,
                    auteur: b.Auteur,
                    Omschrijving: b['Korte omschrijving'] || b.Omschrijving || '',
                    'Korte omschrijving': b['Korte omschrijving'] || b.Omschrijving || '',
                    Niveau: b.Niveau || '',
                    Themas: b.Themas_boek || b.Themas || '',
                    Themas_boek: b.Themas_boek || b.Themas || '',
                    'Type materiaal': b['Type materiaal'] || '',
                    isBookmarked: Boolean(entry),
                    isRead: entry ? entry.isRead : false,
                };
            });

            return reply.status(200).send(boeken)
        }catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Server error' });
        }
    }

    fastify.get<BoekenQuery>(
        '/boeken',
        {
            preHandler: [fastify.authenticate],
            schema: {
                tags: ['boeken'],
                summary: 'Zoek boeken of haal boeken gepagineerd op',
                description: 'Haalt boeken gepagineerd op met filters en zoekterm. Bevat per boek of het in de leeslijst staat en of het gelezen is.',
                security: [{ cookieAuth: [] }],
                querystring: {
                    type: 'object',
                    properties: {
                        zoekTerm: { type: 'string', description: 'Zoekt op titel en auteur' },
                        taalNiveau: { type: 'string' },
                        genre: { type: 'string' },
                        onderwerp: { type: 'string' },
                        page: { type: 'integer', minimum: 1, default: 1 },
                        limit: { type: 'integer', minimum: 1, default: 20 },
                    },
                },
                response: {
                    200: paginatedBoekenSchema,
                    401: foutSchema,
                    500: foutSchema,
                },
            },
        },
        getBooks
    );

    fastify.get<BoekenQuery>(
        '/boek',
        {
            schema: {
                tags: ['boeken'],
                summary: 'Haal één boek op via id',
                querystring: {
                    type: 'object',
                    properties: {
                        boekId: { type: 'string', description: 'MongoDB ObjectId van het boek' },
                    },
                },
                response: {
                    200: ruwBoekSchema,
                    400: foutSchema,
                    404: foutSchema,
                    500: foutSchema,
                },
            },
        },
        getBook
    );

    fastify.get(
        '/getVoorJou',
        {
            preHandler: [fastify.authenticate],
            schema: {
                tags: ['boeken'],
                summary: 'Persoonlijke boekaanbevelingen (max 3)',
                description: 'Gebaseerd op het favoriete type materiaal uit het leesprofiel van de ingelogde student.',
                security: [{ cookieAuth: [] }],
                response: {
                    200: boekenLijstSchema,
                    401: foutSchema,
                    404: foutSchema,
                    500: foutSchema,
                },
            },
        },
        getPersonolizedBooks
    )
}
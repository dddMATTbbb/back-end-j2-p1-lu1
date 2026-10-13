import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ObjectId } from "mongodb";
import {db, db as postgresDb} from "../prisma/db.ts";
import { boekenLijstSchema, ruwBoekSchema, foutSchema } from '../schemas/boeken.ts';

type BoekenQuery = {
    Querystring: {
        zoekTerm?: string,
        boekId?: string
        taalNiveau?: string,
        genre?: string,
        onderwerp?: string,
    };
};

export async function boekenRoutes(fastify: FastifyInstance) {
    const mongoDb = fastify.mongo.client.db('j1-p1-lu1');
    const boekenCollection = mongoDb.collection('boeken');

    async function getBooks(
        request: FastifyRequest<BoekenQuery>,
        reply: FastifyReply
    ) {
        const { zoekTerm, genre, onderwerp, taalNiveau } = request.query;
        const userId = request.user?.id;

        try {
            // Haal de bestaande leeslijst status van de ingelogde gebruiker op uit PostgreSQL
            const userLeesLijst = new Map<string, { isRead: boolean }>();
            if (userId) {
                for await (const row of postgresDb.orm.public.LeesLijst.where({ studentId: userId }).all()) {
                    userLeesLijst.set(row.boekId, { isRead: Boolean(row.isRead) });
                }
            }

            let rawBoeken: any[] = [];

            if (!zoekTerm?.trim()) {
                rawBoeken = await boekenCollection.find().toArray();
            } else {
                try {
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

                    const matchConditions: Record<string, any> = {}

                    if (taalNiveau){
                        matchConditions.Niveau = taalNiveau;
                    }

                    if (genre){
                        matchConditions.genre = genre;
                    }

                    if (Object.keys(matchConditions).length > 0) {
                        pipeline.push({ $match: matchConditions });
                    }

                    pipeline.push({ $limit: 20 });

                    rawBoeken = await boekenCollection.aggregate(pipeline).toArray();

                } catch {
                    // Fallback als MongoDB Atlas search index niet geconfigureerd is
                    rawBoeken = await boekenCollection.find({
                        $or: [
                            { Titel: { $regex: zoekTerm, $options: 'i' } },
                            { Auteur: { $regex: zoekTerm, $options: 'i' } },
                        ]
                    }).limit(20).toArray();
                }
                fastify.log.info({ zoekTerm, aantal: rawBoeken.length }, 'zoekresultaat');
            }

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
                    Themas: b.Themas_boek || b.Themas || '',
                    Themas_boek: b.Themas_boek || b.Themas || '',
                    'Type materiaal': b['Type materiaal'] || '',
                    isBookmarked: Boolean(entry),
                    isRead: entry ? entry.isRead : false,
                };
            });

            return reply.status(200).send(boeken);
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
                summary: 'Zoek boeken of haal alle boeken op',
                description: 'Zonder zoekTerm komen alle boeken terug, met zoekTerm maximaal 20 resultaten. Bevat per boek of het in de leeslijst staat en of het gelezen is.',
                security: [{ cookieAuth: [] }],
                querystring: {
                    type: 'object',
                    properties: {
                        zoekTerm: { type: 'string', description: 'Zoekt op titel en auteur' },
                        taalNiveau: { type: 'string' },
                        genre: { type: 'string' },
                        onderwerp: { type: 'string' },
                    },
                },
                response: {
                    200: boekenLijstSchema,
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
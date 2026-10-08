import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../prisma/db.ts";
import { ObjectId } from "mongodb";

type LeesLijstQuery = {
    Querystring: {
        boekId?: string;
        id?: string;
    };
    Body?: {
        boekId?: string;
        id?: string;
        isRead?: boolean;
        isBookmarked?: boolean;
    };
};

export async function leesLijstRoutes(fastify: FastifyInstance) {
    const mongoDb = fastify.mongo.client.db('j1-p1-lu1');
    const boekenCollection = mongoDb.collection('boeken');

    // GET /leesLijst: Haalt alle boeken in de persoonlijke leeslijst van de student op
    async function handleGetLeeslijst(request: FastifyRequest, reply: FastifyReply) {
        const userId: string = request.user.id;

        try {
            // 1. Haal alle rijen op uit PostgreSQL voor de ingelogde student
            const leesLijstMap = new Map<string, { id: string; isRead: boolean; updatedAt: any }>();
            const boekIds: string[] = [];

            for await (const row of db.orm.public.LeesLijst.where({ studentId: userId }).all()) {
                boekIds.push(row.boekId);
                leesLijstMap.set(row.boekId, {
                    id: row.id,
                    isRead: Boolean(row.isRead),
                    updatedAt: row.updatedAt,
                });
            }

            if (boekIds.length === 0) {
                return reply.status(200).send([]);
            }

            // 2. Haal de bijbehorende boekgegevens op uit MongoDB
            const objectIds: ObjectId[] = [];
            for (const id of boekIds) {
                if (ObjectId.isValid(id)) {
                    objectIds.push(new ObjectId(id));
                }
            }

            const boeken = await boekenCollection.find({ _id: { $in: objectIds } }).toArray();

            // 3. Combineer MongoDB boekinformatie met PostgreSQL status (isRead & isBookmarked)
            const result = boeken.map((b) => {
                const idStr = b._id.toString();
                const entry = leesLijstMap.get(idStr);
                return {
                    id: idStr,
                    _id: idStr,
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
                    isBookmarked: true,
                    isRead: entry ? entry.isRead : false,
                };
            });

            return reply.status(200).send(result);
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: "Serverfout bij het ophalen van de leeslijst" });
        }
    }

    // POST /leesLijst: Voegt een boek toe aan de leeslijst van de student
    async function handleToggleBoekLeeslijst(request: FastifyRequest<LeesLijstQuery>, reply: FastifyReply) {
        const userId: string = request.user.id;
        const boekId = request.body?.boekId || request.body?.id || request.query?.boekId || request.query?.id;
        const explicitIsBookmarked = request.body?.isBookmarked;

        if (!boekId) {
            return reply.status(400).send({ message: "Geen boekId meegegeven" });
        }

        try {
            const existing = await db.orm.public.LeesLijst.where({ studentId: userId, boekId: boekId }).first();
            const shouldBeBookmarked = typeof explicitIsBookmarked === 'boolean' ? explicitIsBookmarked : !existing;

            if (shouldBeBookmarked) {
                if (existing) {
                    return reply.status(200).send({
                        message: "Boek staat al in de leeslijst",
                        boek: existing,
                        isBookmarked: true,
                        isRead: Boolean(existing.isRead),
                    });
                }

                const nieuwBoek = await db.orm.public.LeesLijst.create({
                    studentId: userId,
                    boekId: boekId,
                    isRead: false,
                });

                return reply.status(201).send({
                    message: "Boek succesvol toegevoegd aan de leeslijst",
                    boek: nieuwBoek,
                    isBookmarked: true,
                    isRead: false,
                });
            }

            // Verwijderen (idempotent: deleteAll geeft geen fout als er niets te verwijderen valt)
            await db.orm.public.LeesLijst.where({ studentId: userId, boekId: boekId }).deleteAll();

            return reply.status(200).send({
                message: "Boek succesvol verwijderd uit de leeslijst",
                boekId: boekId,
                isBookmarked: false,
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: "Serverfout bij het bijwerken van de leeslijst" });
        }
    }

    // PATCH & PUT /leesLijst/status: Wijzigt of togglet de gelezen/ongelezen status van een boek
    async function handleUpdateBoekStatus(request: FastifyRequest<LeesLijstQuery>, reply: FastifyReply) {
        const userId: string = request.user.id;
        const boekId = request.body?.boekId || request.body?.id || request.query?.boekId || request.query?.id;
        const explicitIsRead = request.body?.isRead;

        if (!boekId) {
            return reply.status(400).send({ message: "Geen boekId meegegeven" });
        }

        try {
            const existing = await db.orm.public.LeesLijst.where({ studentId: userId, boekId: boekId }).first();

            let targetIsRead: boolean;
            if (existing) {
                targetIsRead = typeof explicitIsRead === 'boolean' ? explicitIsRead : !existing.isRead;
                await db.orm.public.LeesLijst.where({ studentId: userId, boekId: boekId }).update({
                    isRead: targetIsRead,
                });
                return reply.status(200).send({
                    message: "Leesstatus succesvol bijgewerkt",
                    boekId: boekId,
                    isBookmarked: true,
                    isRead: targetIsRead,
                });
            } else {
                // Als het boek nog niet in de leeslijst staat en men klikt op 'gelezen',
                // voegen we het boek direct toe aan de leeslijst met de gekozen status
                targetIsRead = typeof explicitIsRead === 'boolean' ? explicitIsRead : true;
                const nieuwBoek = await db.orm.public.LeesLijst.create({
                    studentId: userId,
                    boekId: boekId,
                    isRead: targetIsRead,
                });
                return reply.status(201).send({
                    message: "Boek toegevoegd aan leeslijst en gemarkeerd",
                    boek: nieuwBoek,
                    isBookmarked: true,
                    isRead: targetIsRead,
                });
            }
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: "Serverfout bij het bijwerken van de leesstatus" });
        }
    }

    fastify.get('/leesLijst', { preHandler: [fastify.authenticate] }, handleGetLeeslijst);
    fastify.post<LeesLijstQuery>('/leesLijst', { preHandler: [fastify.authenticate] }, handleToggleBoekLeeslijst);
    fastify.patch<LeesLijstQuery>('/leesLijst/status', { preHandler: [fastify.authenticate] }, handleUpdateBoekStatus);
    fastify.put<LeesLijstQuery>('/leesLijst/status', { preHandler: [fastify.authenticate] }, handleUpdateBoekStatus);
}
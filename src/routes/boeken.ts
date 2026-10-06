import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {ObjectId} from "mongodb";
import type {LeesProfiel} from "../types/leesprofiel.ts";

type BoekenQuery = {
    Querystring: { zoekTerm?: string };
};

type BoekQuery = {
    Querystring: {boekId?: string};
}

export async function boekenRoutes(fastify: FastifyInstance) {
    const db = fastify.mongo.client.db('j1-p1-lu1');
    const boekenCollection = db.collection('boeken');

    async function getBooks(
        request: FastifyRequest<BoekenQuery>,
        reply: FastifyReply
    ) {
        const { zoekTerm } = request.query;

        try {

            if (!zoekTerm?.trim()) {
                const boeken = await boekenCollection.find().toArray();
                return reply.status(200).send(boeken);
            }

            const boeken = await boekenCollection.aggregate([
                {
                    $search: {
                        index: 'default',
                        text: { query: zoekTerm, path: ['Titel', 'Auteur'], fuzzy: { maxEdits: 1, prefixLength: 2 } },
                    },
                },
                { $limit: 20 },
                { $project:
                        {
                            _id: 0,
                            id: { $toString: '$_id' },
                            Titel: 1,
                            Auteur: 1,
                            'Korte omschrijving': 1,
                            Niveau: 1,
                            Themas_boek: 1,
                            'Type materiaal': 1,
                            score: { $meta: 'searchScore' },
                        }},
            ]).toArray();
            fastify.log.info({ zoekTerm, aantal: boeken.length }, 'zoekresultaat');
            return reply.status(200).send(boeken);
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Database query mislukt' });
        }
    }

    async function getBook(request: FastifyRequest<BoekQuery>, reply: FastifyReply) {
        const { boekId } = request.query as { boekId?: string };

        if (!boekId) {
            return reply.status(400).send({ message: "no boek id found" });
        }

        try{
            const boekIdObject = new ObjectId(boekId);
            const boek = await boekenCollection.findOne({_id: boekIdObject})
            if (!boek) {
                return reply.status(404).send({ message: "Boek niet gevonden" });
            }
            return reply.status(200).send(boek);
        } catch (error) {
            return reply.status(500).send({ error: 'Database query mislukt' });
        }
    }

    async function getRecomendation(request: FastifyRequest<{Body: LeesProfiel}>, reply: FastifyReply) {
        const {leeftijd, gender, leesniveau, genre} = request.body || {};

        if (!leeftijd || !gender || !leesniveau || !genre) {
            return reply.status(400).send({ message: "invalid input" });
        }

        try{

        }catch(err) {

        }
    }

    fastify.get<BoekenQuery>(
        '/boeken',
        { preHandler: [fastify.authenticate] },
        getBooks
    );

    fastify.get<BoekQuery>(
        '/boek',
        { preHandler: [fastify.authenticate] },
        getBook
    )
}
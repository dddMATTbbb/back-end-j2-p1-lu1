import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

type BoekenQuery = {
    Querystring: { zoekTerm?: string };
};

export async function boekenRoutes(fastify: FastifyInstance) {
    async function getBooks(
        request: FastifyRequest<BoekenQuery>,
        reply: FastifyReply
    ) {
        fastify.log.info({ url: request.url, query: request.query }, 'boeken request');
        const { zoekTerm } = request.query;

        try {
            const db = fastify.mongo.client.db('j1-p1-lu1');
            const boekenCollection = db.collection('boeken');

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

    fastify.get<BoekenQuery>(
        '/boeken',
        { preHandler: [fastify.authenticate] },
        getBooks
    );
}
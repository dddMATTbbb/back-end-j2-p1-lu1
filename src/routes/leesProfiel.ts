import type {FastifyInstance, FastifyRequest, FastifyReply} from "fastify";
import type {LeesProfiel} from "../types/leesprofiel.ts";

export async function leesProfielRoutes(fastify: FastifyInstance) {
    async function handleCreateLeesProfiel(request: FastifyRequest<{ Body: LeesProfiel }>, reply: FastifyReply) {
        const userId = request.user.id;
        const { leeftijd, gender, leesniveau, genre } = request.body;

        const checkIfProfielExistQuery = "SELECT * FROM public.lees_profiel WHERE student_id = $1";
        const result = await fastify.pg.query(checkIfProfielExistQuery, [userId]);

        if (result.rows.length > 0) {
            return reply.status(403).send({ message: "Leesprofiel already exist" });
        }

        const query = "INSERT INTO public.lees_profiel (student_id, leeftijd, gender, leesniveau, genre) VALUES ($1, $2, $3, $4, $5)";

        try {
            await fastify.pg.query(query, [userId, leeftijd, gender, leesniveau, genre]);
            return reply.status(200).send({ message: "leesprofiel added successfully" });
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Server fout' });
        }
    }

    async function handleCheckLeesProfiel(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;

        const checkIfProfileExistQuery = "SELECT * FROM public.lees_profiel WHERE student_id = $1 LIMIT 1";

        try{
            const result = await fastify.pg.query(checkIfProfileExistQuery, [userId]);
            if (result.rows.length > 0) {
                return reply.status(200).send({ message: "Leesprofiel already exist" });
            } else{
                return reply.status(200).send({ message: 'Leesprofiel does not exist' });
            }
        }catch(err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Server fout' });
        }
    }

    fastify.post<{ Body: LeesProfiel }>(
        '/leesProfiel',
        { preHandler: [fastify.authenticate] },
        handleCreateLeesProfiel
    );
    fastify.get('/leesProfiel',
        {preHandler: [fastify.authenticate]},
        handleCheckLeesProfiel);
}
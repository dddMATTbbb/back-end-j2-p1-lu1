import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { AuthBody } from '../types/auth';

export async function authRoutes(fastify: FastifyInstance) {
    async function handleLogin(request: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply, isStudent:boolean) {
        const { email, password } = request.body || {};
        let table:string;

        if(isStudent) {
            table = "public.users_student"
        }
        else {
            table = "public.users_docenten"
        }


        if (!email || !password) {
            return reply.status(400).send({ error: 'Invalid input' });
        }

        try {
            const query = "SELECT id, email, password_text " +
                "FROM $1 " +
                "WHERE LOWER(email) = LOWER($2) " +
                "LIMIT 1";
            const result = await fastify.pg.query(query, [table], [email]);

            if (result.rowCount === 0) {
                return reply.status(401).send({ error: 'Ongeldige email of wachtwoord' });
            }

            const user = result.rows[0];

            if (user.password_text !== password) {
                return reply.status(401).send({ error: 'Ongeldige email of wachtwoord' });
            }

            return reply.status(200).send({
                message: "Succesvol ingelogd",
                user: { id: user.id, email: user.email }
            });
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Server fout' });
        }
    }

    fastify.post('/loginStudent', (req: FastifyRequest<{ Body: AuthBody }>, reply) =>
        handleLogin(req, reply, true)
    );

    fastify.post('/loginDocent', (req: FastifyRequest<{ Body: AuthBody }>, reply) =>
        handleLogin(req, reply, false)
    );
}
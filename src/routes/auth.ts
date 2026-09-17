import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { AuthBody } from '../types/auth';

const bycrypt = require('bcrypt');

const saltRounds:number = parseInt(process.env.SALT_ROUNDS!);

export async function authRoutes(fastify: FastifyInstance) {
    if(!saltRounds){
        fastify.log.error("SALT_ROUNDS environment variable is required")
    }

    async function handleLogin(request: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) {
        const { email, password } = request.body || {};

        if (!email || !password) {
            return reply.status(400).send({ error: 'Invalid input' });
        }

        try {
            const query = "SELECT id, email, password_hash " +
                "FROM public.users " +
                "WHERE LOWER(email) = LOWER($1) " +
                "LIMIT 1";
            const result = await fastify.pg.query(query, [email]);

            if (result.rowCount === 0) {
                return reply.status(401).send({ error: 'Ongeldige email of wachtwoord' });
            }

            const user = result.rows[0];

            const isPasswordCorrect:boolean = bycrypt.password(password, user.password_hash);

            if (!isPasswordCorrect) {
                fastify.log.info("Wrong password");
                return reply.status(401).send({ error: 'Ongeldige email of wachtwoord' });
            }

            const token = fastify.jwt.sign({
                id: user.id,
                email: user.email,
            },{
                expiresIn: '1h',
            })

            return reply.status(200).send({
                token,
            });
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Server fout' });
        }
    }

    async function handleSignup(request: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) {
        const { email, password, role } = request.body || {};

        if (!email || !password || !role) {
            return reply.status(400).send({ error: 'Invalid input' });
        }

        const hash:string = bycrypt.hash(password, saltRounds);

        try{
            const query = "INSERT INTO public.users (email, password_hash, role)" +
                "VALUES ($1, $2, $3)"
            await fastify.pg.query(query, [email, hash, role]);
            return reply.status(200).send({message: "Succesvol aangemeld"})
        } catch (err){
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Server fout' });
        }
    }

    fastify.post('/login', handleLogin);
    fastify.post('/signup', handleSignup);
}
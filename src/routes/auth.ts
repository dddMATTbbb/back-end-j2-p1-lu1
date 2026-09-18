import  { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import type { AuthBody } from '../types/auth';
import * as fastify from "fastify";

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

            const isPasswordCorrect:boolean = await bycrypt.compare(password, user.password_hash);

            if (!isPasswordCorrect) {
                fastify.log.info("Wrong password");
                return reply.status(401).send({ error: 'Ongeldige email of wachtwoord' });
            }

            const token = fastify.jwt.sign({
                id: user.id,
                email: user.email,
            },{
                expiresIn: '15m',
            })

            await reply.setCookie("token", token, {
                path: "/",
                httpOnly: true,
                sameSite: "lax",
                maxAge: 7200
            }).send({ message: "Authentication successful", user: {id: user.id, email: user.email} });

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

        const hash:string = await bycrypt.hash(password, saltRounds);

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

    async function handleLogout(request: FastifyRequest, reply: FastifyReply) {
        await reply.clearCookie('token', { path: '/' }).send({ message: 'Uitgelogd' });
    }

    async function checkAuth(req: FastifyRequest, reply: FastifyReply) {

    }

    fastify.post('/login', handleLogin);
    fastify.post('/signup', handleSignup);
    fastify.post('/logout', handleLogout);
    fastify.get('/check-auth', {onRequest: [fastify.authenticate]} ,checkAuth);
}
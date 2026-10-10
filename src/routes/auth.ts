import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { AuthBody } from '../types/auth';
import {db} from "../prisma/db"
import type {Varchar} from "@prisma/orm-postgres/target/codec-types";

const bycrypt = require('bcrypt');

const saltRounds:number = parseInt(process.env.SALT_ROUNDS!);

export async function authRoutes(fastify: FastifyInstance) {
    if(!saltRounds){
        fastify.log.error("SALT_ROUNDS environment variable is required")
    }

    async function handleLogin(request: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) {
        const { email, password, role } = request.body || {};

        if (!email || !password || !role) {
            return reply.status(400).send({ error: 'Invalid input' });
        }

        try {
            const result = await db.orm.public.Users.where({ email: email }).first();

            if (!result) {
                return reply.status(401).send({ error: 'Ongeldige email of wachtwoord' });
            }

            if (result.role !== role) {
                return reply.status(401).send({ error: 'Ongeldige email of wachtwoord' });
            }

            const isPasswordCorrect: boolean = await bycrypt.compare(password, result.passwordHash);

            if (!isPasswordCorrect) {
                return reply.status(401).send({ error: 'Ongeldige email of wachtwoord' });
            }

            const token = request.server.jwt.sign(
                { id: result.id, role: result.role },
                { expiresIn: '15m' }
            );

            await reply.setCookie("token", token, {
                path: "/",
                httpOnly: true,
                sameSite: "lax",
                maxAge: 900
            }).send({ message: "Authentication successful" });

        } catch (err) {
            request.server.log.error(err);
            return reply.status(500).send({ error: 'Server fout' });
        }
    }

    async function handleSignup(request: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) {
        const { email, password, role } = request.body || {};

        if (!email || !password || !role) {
            return reply.status(400).send({ error: 'Invalid input' });
        }

        const checkUser = await db.orm.public.Users.where({ email: email }).first();

        if(checkUser){
            return reply.status(400).send({ error: 'User already exists' });
        }

        const hash: Varchar<255> = await bycrypt.hash(password, saltRounds);

        try{
            await db.orm.public.Users.create({
                email: email,
                passwordHash: hash,
                role: role,
            })
            return reply.status(201).send({message: "Succesvol aangemeld"})
        } catch (err){
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Server fout' });
        }
    }

    async function handleLogout(request: FastifyRequest, reply: FastifyReply) {
        await reply.clearCookie('token', { path: '/' }).send({ message: 'Uitgelogd' });
    }

    async function handleCheckLogin(req: FastifyRequest, reply: FastifyReply) {
        try{
            await req.jwtVerify()
        } catch (err){
            fastify.log.error(err);
            return reply.status(401).send({ message: 'Unauthorized' });
        }

        return reply.status(200).send({ message: "Logged in successful" });
    }

    fastify.post('/login', handleLogin);
    fastify.post('/signup', handleSignup);
    fastify.post('/logout', handleLogout);
    fastify.get('/check-auth', handleCheckLogin);
}
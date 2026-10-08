import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {db as postgresDb, db} from "../prisma/db.ts";
import type {Varchar} from "@prisma/orm-postgres/target/codec-types";
import type {Student} from "../types/student.ts";

type docentQuery = {
    Querystring: {
        docentMail?: Varchar<255>;
        studentId?: string;
    };
}

export async function docentRoutes(fastify: FastifyInstance) {
    const mongoDb = fastify.mongo.client.db('j1-p1-lu1');
    const boekenCollection = mongoDb.collection('boeken');
    async function handleStudentAddDocent(request: FastifyRequest<docentQuery>, reply: FastifyReply) {
        const studentId: string = request.user.id
        const docentEmail = request.query.docentMail;

        if (!docentEmail) {
            return reply.status(400).send({message: "Docent email was not found in the query"});
        }

        try{
            const docent = await db.orm.public.Users.where({
                email: docentEmail,
                role: "docent",
            }).first();

            if (!docent) {
                return reply.status(400).send({message: "Docent email was not found in the db"});
            }

            const checkIfexists = await db.orm.public.StudentenLijstDocent.where({
                docentId: docent.id,
                studentId: studentId,
            }).first();

            if(checkIfexists) {
                return reply.status(400).send({message: "Koppeling bestaat al"});
            }

            await db.orm.public.StudentenLijstDocent.create({
                studentId: studentId,
                docentId: docent.id
            })

            return reply.status(201).send({ message: "Docent gekoppeld" });
        } catch (error){
            return reply.status(500).send({message: "serverfout"});
        }
    }

    async function handleStudentGet(request: FastifyRequest, reply: FastifyReply) {
        const docentId: string = request.user.id
        const students: Student[] = []
        if (!docentId) {
            return reply.status(400).send({message: "Docent id was not found"});
        }

        try{
            const studentRows = await db.orm.public.StudentenLijstDocent.where({docentId: docentId}).all();
            if (studentRows.length === 0) {
                return reply.status(400).send({message: "There are no students"});
            }

            const studentIds = studentRows.map(row => row.studentId)

            for (const studentId of studentIds) {
                const studentInfo = await db.orm.public.Users.where({ id: studentId }).select("id", "email").first();
                if (!studentInfo) continue;
                students.push(studentInfo);
            }

            return reply.status(200).send(students);

        } catch (error){
            return reply.status(500).send({message: "serverfout"});
        }
    }

    async function handleGetStudentBooks(request: FastifyRequest<docentQuery>, reply: FastifyReply) {
        const docentId: string = request.user.id
        const studentId: string | undefined = request.query.studentId;

        if (!studentId) {
            return reply.status(400).send({message: "Student id was not found"});
        }

        try{
            const checkStudentLink = await db.orm.public.StudentenLijstDocent.where({studentId: studentId, docentId: docentId}).first();
            if (!checkStudentLink) {
                return reply.status(401).send({message: "There is no link between student and docent"});
            }

            // Haal de bestaande leeslijst status van de ingelogde gebruiker op uit PostgreSQL
            const userLeesLijst = new Map<string, { isRead: boolean }>();
            if (studentId) {
                for await (const row of postgresDb.orm.public.LeesLijst.where({ studentId: studentId }).all()) {
                    userLeesLijst.set(row.boekId, { isRead: Boolean(row.isRead) });
                }
            }

            const rawBoeken = await boekenCollection.find().toArray();

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
        }catch (error) {
            return reply.status(500).send({message: "serverfout"});
        }
    }

    fastify.post<docentQuery>('/addDocent',
        {preHandler: [fastify.authenticate]},
        handleStudentAddDocent
    );

    fastify.get('/getStudents',
        {preHandler: [fastify.authenticate]},
        handleStudentGet
    );
}
import Fastify, { type FastifyRequest } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    usersWhere: vi.fn(),
    linksWhere: vi.fn(),
    linksCreate: vi.fn(),
}));

vi.mock('../prisma/db.ts', () => ({
    db: { orm: { public: {
        Users: { where: mocks.usersWhere },
        StudentenLijstDocent: { where: mocks.linksWhere, create: mocks.linksCreate },
        LeesLijst: { where: vi.fn() },
    } } },
}));

import { docentRoutes } from './Docent.ts';

describe('POST /addDocent', () => {
    let app: ReturnType<typeof Fastify>;

    beforeEach(async () => {
        mocks.usersWhere.mockReturnValue({ first: async () => ({ id: 'docent-1' }) });
        mocks.linksWhere.mockReturnValue({ first: async () => null });
        mocks.linksCreate.mockResolvedValue({});

        app = Fastify();
        const boekenCollection = { find: () => ({ toArray: async () => [] }) };
        (app as any).decorate('mongo', { client: { db: () => ({ collection: () => boekenCollection }) } });
        app.decorate('authenticate', async (request: FastifyRequest) => { request.user = { id: 'student-1', role: 'student' }; });
        await app.register(docentRoutes);
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
        vi.clearAllMocks();
    });

    it('maakt een koppeling met een gevonden docent', async () => {
        const response = await app.inject({ method: 'POST', url: '/addDocent?docentMail=docent%40example.nl' });

        expect(response.statusCode).toBe(201);
        expect(response.json()).toEqual({ message: 'Docent gekoppeld' });
        expect(mocks.linksCreate).toHaveBeenCalledWith({ studentId: 'student-1', docentId: 'docent-1' });
    });

    it('wijst een e-mailadres af dat geen docent oplevert', async () => {
        mocks.usersWhere.mockReturnValue({ first: async () => null });

        const response = await app.inject({ method: 'POST', url: '/addDocent?docentMail=onbekend%40example.nl' });

        expect(response.statusCode).toBe(400);
        expect(mocks.linksCreate).not.toHaveBeenCalled();
    });

    it('maakt geen dubbele koppeling aan', async () => {
        mocks.linksWhere.mockReturnValue({ first: async () => ({ studentId: 'student-1' }) });

        const response = await app.inject({ method: 'POST', url: '/addDocent?docentMail=docent%40example.nl' });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({ message: 'Koppeling bestaat al' });
        expect(mocks.linksCreate).not.toHaveBeenCalled();
    });
});

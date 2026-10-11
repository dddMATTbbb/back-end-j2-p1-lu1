import Fastify, { type FastifyRequest } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ leesLijstWhere: vi.fn(), leesLijstCreate: vi.fn() }));

vi.mock('../prisma/db.ts', () => ({
    db: { orm: { public: { LeesLijst: { where: mocks.leesLijstWhere, create: mocks.leesLijstCreate } } } },
}));

import { leesLijstRoutes } from './leesLijst.ts';

describe('POST /leesLijst', () => {
    let app: ReturnType<typeof Fastify>;

    beforeEach(async () => {
        mocks.leesLijstWhere.mockReturnValue({ first: async () => null });
        mocks.leesLijstCreate.mockResolvedValue({ id: 'entry-1', isRead: false });

        app = Fastify();
        const boekenCollection = { find: () => ({ toArray: async () => [] }) };
        (app as any).decorate('mongo', { client: { db: () => ({ collection: () => boekenCollection }) } });
        app.decorate('authenticate', async (request: FastifyRequest) => { request.user = { id: 'student-1', role: 'student' }; });
        await app.register(leesLijstRoutes);
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
        vi.clearAllMocks();
    });

    it('maakt een leeslijstvermelding aan voor een nieuw boek', async () => {
        const response = await app.inject({ method: 'POST', url: '/leesLijst', payload: { boekId: 'boek-1', isBookmarked: true } });

        expect(response.statusCode).toBe(201);
        expect(response.json()).toMatchObject({ isBookmarked: true, isRead: false });
        expect(mocks.leesLijstCreate).toHaveBeenCalledWith({ studentId: 'student-1', boekId: 'boek-1', isRead: false });
    });

    it('voegt een boek dat al op de leeslijst staat niet opnieuw toe', async () => {
        const existing = { id: 'entry-1', isRead: true };
        mocks.leesLijstWhere.mockReturnValue({ first: async () => existing });

        const response = await app.inject({ method: 'POST', url: '/leesLijst', payload: { boekId: 'boek-1', isBookmarked: true } });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({ boek: existing, isBookmarked: true, isRead: true });
        expect(mocks.leesLijstCreate).not.toHaveBeenCalled();
    });

    it('wijst ontbrekende boek-id af', async () => {
        const response = await app.inject({ method: 'POST', url: '/leesLijst', payload: {} });

        expect(response.statusCode).toBe(400);
        expect(mocks.leesLijstCreate).not.toHaveBeenCalled();
    });
});

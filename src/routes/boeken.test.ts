import Fastify, { type FastifyRequest } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ leesLijstWhere: vi.fn() }));

vi.mock('../prisma/db.ts', () => ({
    db: { orm: { public: { LeesLijst: { where: mocks.leesLijstWhere } } } },
}));

import { boekenRoutes } from './boeken.ts';

describe('GET /boeken', () => {
    let app: ReturnType<typeof Fastify>;

    beforeEach(async () => {
        mocks.leesLijstWhere.mockReturnValue({
            async *all() {
                yield { boekId: 'boek-1', isRead: true };
            },
        });

        const mockCursor = {
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            toArray: async () => [
                { _id: { toString: () => 'boek-1' }, Titel: 'De ontdekking', Auteur: 'A. Schrijver' },
                { _id: { toString: () => 'boek-2' }, Titel: 'Nieuw boek', Auteur: 'B. Auteur' },
            ],
        };

        const boekenCollection = {
            countDocuments: vi.fn().mockResolvedValue(2),
            find: vi.fn(() => mockCursor),
        };

        app = Fastify();
        (app as any).decorate('mongo', { client: { db: () => ({ collection: () => boekenCollection }) } });
        app.decorate('authenticate', async (request: FastifyRequest) => { request.user = { id: 'student-1', role: 'student' }; });
        await app.register(boekenRoutes);
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
        vi.clearAllMocks();
    });

    it('geeft boeken terug met leeslijststatus en standaardstatus voor een niet-opgeslagen boek', async () => {
        const response = await app.inject({ method: 'GET', url: '/boeken' });
        const data = response.json();

        expect(response.statusCode).toBe(200);
        expect(data.total).toBe(2);
        expect(data.page).toBe(1);
        expect(data.limit).toBe(20);
        expect(data.totalPages).toBe(1);
        expect(data.boeken[0]).toMatchObject({ id: 'boek-1', titel: 'De ontdekking', isBookmarked: true, isRead: true });
        expect(data.boeken[1]).toMatchObject({ id: 'boek-2', isBookmarked: false, isRead: false });
        expect(mocks.leesLijstWhere).toHaveBeenCalledWith({ studentId: 'student-1' });
    });
});

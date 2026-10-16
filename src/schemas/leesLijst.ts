export const boekSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        _id: { type: 'string' },
        Titel: { type: 'string' },
        titel: { type: 'string' },
        Auteur: { type: 'string' },
        auteur: { type: 'string' },
        Omschrijving: { type: 'string' },
        'Korte omschrijving': { type: 'string' },
        Niveau: { type: 'string' },
        Themas: { type: 'string' },
        Themas_boek: { type: 'string' },
        'Type materiaal': { type: 'string' },
        isBookmarked: { type: 'boolean' },
        isRead: { type: 'boolean' },
    },
} as const;

export const leesLijstStatusSchema = {
    type: 'object',
    properties: {
        message: { type: 'string' },
        boekId: { type: 'string' },
        boek: { type: 'object', additionalProperties: true },
        isBookmarked: { type: 'boolean' },
        isRead: { type: 'boolean' },
    },
};

export const foutSchema = {
    type: 'object',
    properties: {
        message: { type: 'string' },
    },
} as const;

export const boekenLijstSchema = {
    type: 'array',
    items: boekSchema,
} as const;

export const paginatedLeesLijstSchema = {
    type: 'object',
    properties: {
        boeken: boekenLijstSchema,
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
    },
    required: ['boeken', 'total', 'page', 'limit', 'totalPages'],
} as const;

export const statusRouteSchema = {
    tags: ['leesLijst'],
    summary: 'Wijzig de gelezen-status van een boek',
    description: 'Zonder isRead wordt de huidige status omgedraaid. Staat het boek nog niet in de leeslijst, dan wordt het toegevoegd.',
    security: [{ cookieAuth: [] }],
    body: {
        type: 'object',
        required: ['boekId'],
        properties: {
            boekId: { type: 'string' },
            isRead: { type: 'boolean' },
        },
    },
    response: {
        200: leesLijstStatusSchema,
        201: leesLijstStatusSchema,
        400: foutSchema,
        401: foutSchema,
        500: foutSchema,
    },
};
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

export const boekenLijstSchema = {
    type: 'array',
    items: boekSchema,
} as const;

export const paginatedBoekenSchema = {
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

export const ruwBoekSchema = {
    type: 'object',
    additionalProperties: true,
    properties: {
        _id: { type: 'string' },
        Titel: { type: 'string' },
        Auteur: { type: 'string' },
        'Korte omschrijving': { type: 'string' },
        Niveau: { type: 'string' },
        Themas_boek: { type: 'string' },
        'Type materiaal': { type: 'string' },
    },
} as const;

export const foutSchema = {
    type: 'object',
    properties: {
        message: { type: 'string' },
        error: { type: 'string' },
    },
} as const;
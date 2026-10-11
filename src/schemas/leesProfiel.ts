export const berichtSchema = {
    type: 'object',
    properties: {
        message: { type: 'string' },
    },
};

export const leesProfielBodySchema = {
    type: 'object',
    required: ['leeftijd', 'gender', 'leesniveau', 'favorieteTypeMatariaal'],
    properties: {
        leeftijd: { type: 'integer' },
        gender: { type: 'string' },
        leesniveau: { type: 'string' },
        favorieteTypeMatariaal: { type: 'string' },
    },
};

export const leesProfielRijSchema = {
    type: 'object',
    additionalProperties: true,
    properties: {
        studentId: { type: 'string' },
        leeftijd: { type: 'integer' },
        gender: { type: 'string' },
        leesniveau: { type: 'string' },
        favorieteTypeMatariaal: { type: 'string' },
    },
};
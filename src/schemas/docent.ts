export const foutSchema = {
    type: 'object',
    properties: {
        message: { type: 'string' },
    },
} as const;

export const succesSchema = {
    type: 'object',
    properties: {
        message: { type: 'string' },
    },
} as const;

export const succesGetStudentsSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            email: { type: 'string' }
        }
    }
} as const;

export const succesUpdateLeeslijstStudentSchema = {
    type: 'object',
    properties: {
        message: {type: 'string' },
        boekId: {type: 'string'},
        isBookmarked: {type: 'boolean'},
        isRead: {type: 'boolean'},
    }
}
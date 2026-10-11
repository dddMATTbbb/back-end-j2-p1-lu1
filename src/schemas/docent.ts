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
    type: 'object',
    properties: {
        id: { type: 'string' },
        email: { type: 'string' }
    }
}

export const succesUpdateLeeslijstStudentSchema = {
    type: 'object',
    properties: {
        message: {type: 'string' },
        boekId: {type: 'string'},
        isBookmarked: {type: 'boolean'},
        isRead: {type: 'boolean'},
    }
}
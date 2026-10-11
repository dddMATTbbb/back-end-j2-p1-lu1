export const authBodySchema = {
    type: 'object',
    required: ['email', 'password', 'role'],
    properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
        role: { type: 'string', enum: ['student', 'docent'] },
    },
} as const;

export const berichtSchema = {
    type: 'object',
    properties: {
        message: { type: 'string' },
    },
} as const;

export const authFoutSchema = {
    type: 'object',
    properties: {
        error: { type: 'string' },
        message: { type: 'string' },
    },
} as const;
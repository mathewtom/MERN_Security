const envSchema = [
    {
        envKey: 'NODE_ENV',
        configKey: 'nodeEnv',
        required: false,
        default: 'development',
        type: 'string',
    },

    {
        envKey: 'SERVER_PORT',
        configKey: 'port',
        required: false,
        default: 4000,
        type: 'number',
    },

    {
        envKey: 'MONGO_URI',
        configKey: 'mongoUri',
        required: true,
        type: 'string',
    },

    {
        envKey: 'JWT_ACCESS_SECRET',
        configKey: 'jwtAccessSecret',
        required: true,
        type: 'string',
    },

    {
        envKey: 'JWT_REFRESH_SECRET',
        configKey: 'jwtRefreshSecret',
        required: true,
        type: 'string',
    },

    {
        envKey: 'JWT_ACCESS_EXPIRES_IN',
        configKey: 'jwtAccessExpiresIn',
        required: false,
        default: '15m',
        type: 'string',
    },

    {
        envKey: 'JWT_REFRESH_EXPIRES_IN',
        configKey: 'jwtRefreshExpiresIn',
        required: false,
        default: '7d',
        type: 'string',
    },

    {
        envKey: 'CSRF_SECRET',
        configKey: 'csrfSecret',
        required: true,
        type: 'string',
    },

    {
        envKey: 'CLIENT_URL',
        configKey: 'clientUrl',
        required: false,
        default: 'http://localhost:5173',
        type: 'string',
    },
];

function validateEnv() {

    const errors = [];
    const config = {};

    for (const field of envSchema) {

        const raw = process.env[field.envKey];

    // Missing Value handling
        if (raw === undefined || raw === '') {
            if (field.required) {
                errors.push(`${field.envKey} is required but has not been set`);
                continue;
            }

            config[field.configKey] = field.default;
            continue;
       }

    //Type Casting
        if (field.type === 'number') {
            const parsed = Number(raw);
            if (Number.isNaN(parsed)){
                errors.push(`${field.envKey} is expected a number. Received "${raw}" instead`);
                continue;
            }
            config[field.configKey] = parsed;

        } else {
            config[field.configKey] = raw;
        }

    }

    if (errors.length > 0) {
        const message = [
           'The following environment variables are missing',
           ...errors,
        ].join('\n');

        throw new Error(message);
    }

    //Freeze config
    return Object.freeze(config);
}

export const config = validateEnv();

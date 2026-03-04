import pino from 'pino';
import pinoHttp from 'pino-http';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        // Human readable timestamps instead of Unix ms
        translateTime: 'HH:MM:ss.l',
        // ignore pid and hostname is not useful 
        ignore: 'pid,hostname',
      },
    },
  }),
});

export const requestLogger = pinoHttp({
    logger, 
    //Define Log Levels
    customLogLevel: (_req, res, error) => {
        if (error || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return info;
    },

    //Define what should be logged. Ensure to leave Auth Headers and Cookies out of log
    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url,
            query: req.query,
            //Intentionally do not log headers, body and params
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
    },

    autoLogging: {
        ignore: (req) => req.url === '/api/health',  //don't log requests to this api, its just health checks anyway.
    },


});
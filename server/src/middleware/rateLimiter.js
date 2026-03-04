import rateLimit from 'express-rate-limit';

//Globally applied rate limiter
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 mins
    max: 100,  //100 requests per window 
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'fail',
        message: 'Too many requests. Try again in 15 mins',
    }, 
});

//Rate Limiter for Auth Endpoints --> tighter limits
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 mins
    max: 20,    //20 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
        status: 'fail',
        message: 'Too many attempts. Try again in 15 mins',
    },
});


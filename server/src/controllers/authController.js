import * as authService from '../services/authService.js';

const COOKIE_NAME = 'refreshToken';

function getCookieOptions(){
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', //secure set only for production
        sameSite: 'strict', //prevents CSRF
        path: '/api/auth', //ensures that refreshToken is only sent with /api/auth requests
        maxAge: 7 * 24 * 60 * 60 * 1000, //7 days in milliseconds
    };
}

function catchAsync(fn) { //wrapper function to catch promise errors
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export const register = catchAsync (async (req,res) => {
    const { email, password, firstName, lastName } = req.body;

    const { user, accessToken, refreshToken } = await authService.registerUser({
        email,
        password, 
        firstName,
        lastName,
    });

res.cookie(COOKIE_NAME, refreshToken. getCookieOptions());

res.status(201).json({
    status: 'success',
    data: {
        user,
        accessToken,
    }
    });

});

export const login = catchAsync (async(req,res) => {
    const { email, password } = req.body;

    //The below will be updated with Zod schema validation

    if(!email || !password) {
        const { default: AppError} = await import('../utils/AppError.js');
        throw new AppError('Email and Password are required.', 400);
    }

    const { user, accessToken, refreshToken } = await authService.loginUser({
        email,
        password
    });

    res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

    res.status(200).json({
        status: 'success',
        data: {
            user,
            accessToken,
        },
    });
});

export const refresh = catchAsync(async (req, res) => {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
        const { default:AppError } = await import('../utils/AppError.js');
        throw new AppError('No Refresh Token Provided', 401);
    }

    const { user, accessToken, refreshToken } = await authService.refreshTokens(token);

    res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

    res.status(200).json({
        status: 'success',
        data: {
            user,
            accessToken,
        },
    });
});

export const logout = catchAsync(async (req, res) => {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) {
        await authService.logoutUser(token);
    }
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
    });

    res.status(200).json({
        status: 'success',
        message: 'Logged Out',
    });
});
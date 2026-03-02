
import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import { config } from '../config/env.js';
import AppError from '../utils/AppError.js';

//Hash with SHA-256

function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user._id,
            role: user.role,
        },
        config.JWT_ACCESS_SECRET,
        {
            expiresIn: config.JWT_ACCESS_EXPIRES_IN, 
        }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user._id,
            jti: randomBytes(16).toString('hex'),
        },
        config.JWT_REFRESH_SECRET,
        {
            expiresIn: config.JWT_REFRESH_EXPIRES_IN,
        }
    );
}

async function issueTokenPair(user, oldTokenHash = null) {

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const newTokenHash = hashToken(refreshToken);

    const expiresIn = parseTimeString(config.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + expiresIn);

    //Remove the old token
    if (oldTokenHash) {
        user.refreshTokens = user.refreshTokens.filter(
            (rt) => rt.token!== oldTokenHash
        );
    }
    
    //Add the new token hash
    user.refreshTokens.push({token: newTokenHash, expiresAt});
    await user.save({ validateBeforeSave: false}); //Don't use pre-save hook within User Model

    return { accessToken, refreshToken };

}

//Generic  function to parse times strings (like 15m or 7 days) into milliseconds. Function has been copied.
function parseTimeString(timeStr) {
  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid time string: "${timeStr}". Expected format like "15m", "7d", "1h".`);
  }

  const [, value, unit] = match;
  return parseInt(value, 10) * units[unit];
}

//Following are exported modules

//User Registration Service
export async function registerUser({ email, password, firstName, lastName }) {

        //Check for existing user
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new AppError ('Email Already Exists', 409);
        }

        //Create new user
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
        });

        const { accessToken, refreshToken } = await issueTokenPair(user);

        return {
            user: sanitizeUser(user),
            accessToken,
            refreshToken,
        };
}

//User Login Service
export async function loginUser({email, password}) {

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if(!user) {
        throw new AppError('Invalid email or password', 401);
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if(!isPasswordCorrect) {
        throw new AppError('Invalid email or password', 401);
    }


    //Take the opportunity to clean refresh tokens
    user.refreshTokens = user.refreshTokens.filter((rt) => rt.expiresAt > new Date());

    const { accessToken, refreshToken } = await issueTokenPair(user);

    return {
        user: sanitizeUser(user), accessToken, refreshToken,
    };
    
}

//Refresh refeshTokens Service
export async function refreshTokens(token){

    let payload;

    //Verify refreshToken jwt sent by user
    try {
        payload = jwt.verify(token, config.JWT_REFRESH_SECRET);
    } catch {
        throw new AppError('Invalid or expired refresh token', 401);
    }

    //Find the user this token belongs to
    const user = await User.findById(payload.sub);
    if(!user) {
        throw new AppError('User not found', 401);
    }

    //Hash the incoming token and look for it in stored tokens
    const tokenHash = hashToken(token);
    const storedToken = user.refreshTokens.find((rt) => rt.token === tokenHash);
    
    if (!storedToken) { //Indicator of possible token theft
        user.refreshTokens = []; //Clear all refresh tokens in order to logout the user
        await user.save({ validateBeforeSave: false });

        throw new AppError('Please Log in', 401);
    }

    const { accessToken, refreshToken } = await issueTokenPair(user, tokenHash);

    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
    };
}


//User Logout Service

export async function logoutUser(token) {
    //Logout by removing refreshToken; this mean Access is still valid for upto 15m

    let payload;
    
    //Verify refreshToken
    try {
        payload = jwt.verify(token, config.JWT_REFRESH_SECRET);
    } catch {
        return; //nothing to do, user is already logged out
    }

    const user = await User.findById(payload.sub);
    if (!user) return; //nothing to do, user doesn't exit

    //Remove the token
    const tokenHash = hashToken(token);
    user.refreshTokens = user.refreshTokens.filter(
        (rt) => rt.token !== tokenHash
    );

    await user.save({ validateBeforeSave: false});
}

//SanitizeUser function: Used to remove internal properties on Mongoose User Document

function sanitizeUser(user) {
    return {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
    };
}
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import AppError from '../utils/AppError.js';

//Function to extract token from Auth Header
function extractToken(authHeader){

    if(!authHeader) return null;

    //Split up the token
    const parts = authHeader.split(' ');
    //If token does not have 2 parts and first part must be "Bearer"
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

    return parts[1]; //return the extracted token
    
}

//Main Authenticate Middleware
function authenticate(req,res,next) {
    const token = extractToken(req.headers.authorization); //extract the token from auth header

    if (!token) {
        return next(
            new AppError('Authentication Required', 401)
        );
    }

    try {
        //Verify the jwt
        const decoded = jwt.verify(token, config.jwtAccessSecret);

        //Attach user info to req object
        req.user = {
            id: decoded.sub,  //MongoDB _id
            role: decoded.role,
        };

        next();
    } catch (error) {
        next(error);
    }
}

export default authenticate;
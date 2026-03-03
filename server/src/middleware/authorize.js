//RBAC Middleware

import AppError from '../utils/AppError.js';

function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(
                new AppError (
                    'Auth check failed', 500
                )
            );
        }
    
        if(!roles.includes(req.user)) {
            return next(
                new AppError ('You do not have permission', 403)
            );
        }
    
        next(); // User has an allowed role - continue
    };
}

export default authorize;

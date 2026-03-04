
import { ZodError } from 'zod';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, _res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {const messages = error.issues.map((issue) => {
        const field = issue.path.join('.');
        return `${field}: ${issue.message}`;
      });

      return next(new AppError(messages.join('. '), 400));
    }

    // If it's not a ZodError, something unexpected happened — pass it along
    next(error);
  }
};

export default validate;
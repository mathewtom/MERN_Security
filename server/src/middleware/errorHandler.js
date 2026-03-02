

import AppError from '../utils/AppError.js';

//Various error handlers sent by other controllers/services/etc.
function handleValidationError(err) {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(messages.join('. '), 400);
}


function handleCastError(err) {
  return new AppError(`Invalid value for ${err.path}: "${err.value}"`, 400);
}


function handleDuplicateKeyError(err) {
  const fields = Object.keys(err.keyValue).join(', ');
  return new AppError(`Duplicate value for: ${fields}. Please use a different value.`, 409);
}


function handleJWTError() {
  return new AppError('Invalid token. Please log in again.', 401);
}


function handleJWTExpiredError() {
  return new AppError('Token has expired. Please log in again.', 401);
}

// Main error handler
function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Development vs Production responses
  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, res);
  } else {
    sendProdError(err, res);
  }
}

// Development error response — include everything for debugging.
function sendDevError(err, res) {
  // Log the full error to the server console for visibility
  console.error('Error:', err);

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
}

//Production Error Responses
function sendProdError(err, res) {
  let error = { ...err, message: err.message, name: err.name };

  // Transform known error types into AppErrors
  if (error.name === 'ValidationError')        error = handleValidationError(error);
  if (error.name === 'CastError')              error = handleCastError(error);
  if (error.code === 11000)                    error = handleDuplicateKeyError(error);
  if (error.name === 'JsonWebTokenError')      error = handleJWTError();
  if (error.name === 'TokenExpiredError')      error = handleJWTExpiredError();

  if (error.isOperational) {
    // Operational error: safe to send to client.
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  } else {
    console.error('Unexpected Error:', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }
}

export default errorHandler;

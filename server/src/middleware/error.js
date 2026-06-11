/** Central error handler - converts known error shapes into clean JSON responses. */
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';

  // Mongoose: invalid ObjectId
  if (err.name === 'CastError') {
    status = 404;
    message = 'Resource not found';
  }

  // Mongoose: schema validation
  if (err.name === 'ValidationError') {
    status = 422;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Mongo: duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `That ${field} is already in use`;
  }

  // Multer upload errors
  if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 10 MB)' : err.message;
  }

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ success: false, message });
}

module.exports = errorHandler;

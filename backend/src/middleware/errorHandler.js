export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ 
      error: 'Invalid ID format' 
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ 
      error: `${field} already exists` 
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Invalid authentication token' 
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'Authentication token expired' 
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
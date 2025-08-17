// Response time optimization middleware
const responseTimeOptimization = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 200) {
      console.warn(`Slow API response: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
};

module.exports = responseTimeOptimization;
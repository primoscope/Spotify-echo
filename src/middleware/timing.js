/**
 * Request timing middleware for performance monitoring
 * Generated with Perplexity AI assistance for EchoTune AI
 */

const requestTiming = (req, res, next) => {
    const startTime = Date.now();
    
    // Add start time to request object
    req.startTime = startTime;
    
    // Override res.end to calculate duration
    const originalEnd = res.end;
    res.end = function(...args) {
        const duration = Date.now() - startTime;
        
        // Add timing header
        res.set('X-Response-Time', `${duration}ms`);
        
        // Log performance metrics
        console.log(`${req.method} ${req.path} - ${duration}ms`);
        
        // Store metrics for analytics
        if (global.performanceMetrics) {
            global.performanceMetrics.push({
                method: req.method,
                path: req.path,
                duration,
                timestamp: new Date().toISOString(),
                userAgent: req.get('User-Agent')
            });
        }
        
        originalEnd.apply(this, args);
    };
    
    next();
};

module.exports = requestTiming;

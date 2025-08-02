const rateLimit = require('express-rate-limit');

const reportLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 5, 
  message: {
    message: "Too many requests. Please try again after a minute.",
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});


const borrowerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 5, 
  message: {
    message: "Too many requests. Please try again after a minute.",
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});


module.exports = {
  borrowerLimiter,
  reportLimiter
};
const express = require('express');

const borrowerRoutes = require('./routes/borrower.routes');
const bookRoutes = require('./routes/book.routes');
const borrowRoutes = require('./routes/borrow.routes');
const reportRoutes = require('./routes/report.routes');

const errorHandler = require('./middlewares/error.middleware');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Library API is running',
    endpoints: {
      borrowers: '/api/borrowers',
      books: '/api/books',
      borrows: '/api/borrows',
      reports: '/api/reports'
    }
  });
});

app.use('/api/borrowers', borrowerRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/reports', reportRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: {
      code: 'ROUTE_NOT_FOUND',
      method: req.method,
      path: req.originalUrl
    }
  });
});

app.use(errorHandler);

module.exports = app;
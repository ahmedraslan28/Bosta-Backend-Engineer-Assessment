const express = require('express');
const borrowerRoutes = require('./routes/borrower.routes');
const errorHandler = require('./middlewares/error.middleware');
const bookRoutes = require('./routes/book.routes');
const borrowRoutes = require('./routes/borrow.routes')
const reportRoutes = require('./routes/report.routes')
const app = express();

app.use(express.json());

app.use('/api/borrowers', borrowerRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/reports', reportRoutes);

app.use(errorHandler);

app.get('/', (req, res) => {
  res.json({ message: 'Library API is running' });
});

module.exports = app;

const { checkOutBook, returnBook, getAllBorrows } = require('../services/borrow.service');

async function borrowBook(req, res, next) {
  try {
    const borrowerId = parseInt(req.body.borrowerId);
    const bookId = parseInt(req.body.bookId);
    const days = parseInt(req.body.days) || 14;

    if (!bookId || isNaN(bookId)) {
      return res.status(400).json({ success: false, message: 'Book ID is required' });
    }

    const result = await checkOutBook(borrowerId, bookId, days);

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function handleReturnBook(req, res, next) {
  try {
    const borrowId = parseInt(req.params.borrowId);
    const result = await returnBook(borrowId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function listAllBorrows(req, res, next) {
  try {
    const borrows = await getAllBorrows(req.query);
    res.json({ success: true, data: borrows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  borrowBook,
  handleReturnBook,
  listAllBorrows
};

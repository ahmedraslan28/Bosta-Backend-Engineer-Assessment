const {
  createBook,
  editBook,
  removeBook,
  getAllBooks,
  searchBook,
} = require('../services/book.service');

exports.addBook = async (req, res, next) => {
  try {
    const book = await createBook(req.body);
    res.status(201).json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    const book = await editBook(req.params.id, req.body);
    res.json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    await removeBook(req.params.id);
    res.json({ success: true, message: 'Book deleted' });
  } catch (err) {
    next(err);
  }
};

exports.listBooks = async (req, res, next) => {
  try {
    const { books, pagination } = await getAllBooks(req.query);
    res.json({ success: true, data: books, pagination });
  } catch (err) {
    next(err);
  }
};


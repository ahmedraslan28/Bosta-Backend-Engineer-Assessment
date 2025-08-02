const express = require('express');
const { body, query } = require('express-validator');
const validate = require('../middlewares/validation.middleware');
const auth = require('../middlewares/auth.middleware');
const {
  addBook,
  updateBook,
  deleteBook,
  listBooks,
  searchBooks
} = require('../controllers/book.controller');

const router = express.Router();

// create new book 
router.post(
  '/',
  auth,
  [
    body('title')
      .notEmpty().withMessage('Title is required')
      .isString().withMessage('Title must be a string'),

    body('author')
      .notEmpty().withMessage('Author is required')
      .isString().withMessage('Author must be a string'),

    body('isbn')
      .notEmpty().withMessage('ISBN is required')
      .isString().withMessage('ISBN must be a string'),

    body('quantity')
      .notEmpty().withMessage('quantity is required')
      .isInt({ min: 0 }).withMessage('quantity must be greater than 0'),

    body('shelfLocation')
      .notEmpty().withMessage('Shelf location is required')
      .isString().withMessage('Shelf location must be a string'),
  ],
  validate,
  addBook
);

// update book 
router.patch(
  '/:id',
  auth,
  [
    body('title')
      .optional()
      .isString().withMessage('Title must be a string'),

    body('author')
      .optional()
      .isString().withMessage('Author must be a string'),

    body('isbn')
      .optional()
      .isString().withMessage('ISBN must be a string'),

    body('quantity')
      .optional()
      .isInt({ min: 0 }).withMessage('quantity must be greater than 0'),

    body('shelfLocation')
      .optional()
      .isString().withMessage('Shelf location must be a string'),
  ],
  validate,
  updateBook
);

// delete book 
router.delete('/:id', auth, deleteBook);

// get all books 
// filter with title, author, isbn and availability 
router.get('/', listBooks);

module.exports = router;

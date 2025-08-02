const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { borrowBook, handleReturnBook, listAllBorrows } = require('../controllers/borrow.controller');
const authMiddleware = require('../middlewares/auth.middleware'); 
const validate = require('../middlewares/validation.middleware');

// borrow book 
router.post(
  '/',
  [
    body('borrowerId').isInt({ min: 1 }).withMessage('Invalid borrower ID'),
    body('bookId').isInt({ min: 1 }).withMessage('Book ID must be a positive integer'),
    body('days')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Days must be a positive integer if provided'),
  ],
  validate,
  authMiddleware,
  borrowBook
);

// return a book
router.patch(
  '/:borrowId',
  [ param('borrowId').isInt().withMessage('Invalid borrow ID') ],
  validate,
  authMiddleware,
  handleReturnBook
);

router.get(
  '/',
  authMiddleware,
  listAllBorrows
);




module.exports = router;
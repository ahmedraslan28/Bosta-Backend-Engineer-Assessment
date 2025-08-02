const express = require('express');
const {
  registerBorrower,
  listAllBorrowers,
  editBorrower,
  removeBorrower,
  listCurrentBorrows
} = require('../controllers/borrower.controller');
const { body } = require('express-validator');
const validate = require('../middlewares/validation.middleware');

const { borrowerLimiter } = require('../config/rateLimit.config');


const auth = require('../middlewares/auth.middleware');

const router = express.Router();

// register new borrower 
router.post(
  '/',
  [
    body('name')
      .notEmpty().withMessage('Name is required'),

    body('email')
    .notEmpty().withMessage('email is required')
      .isEmail().withMessage('Must be a valid email'),
  ],
  validate,
  auth,
  registerBorrower,
);

// list all borrowers 
router.get('/', auth, borrowerLimiter, listAllBorrowers);

// update borrower
router.patch(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('updated name cannot be empty'),
    body('email').optional().isEmail().withMessage('Invalid email'),
  ],
  validate,
  auth,
  editBorrower
);

// remove borrower
router.delete('/:id', auth, removeBorrower);

// books the borrower currently have
router.get('/:id/currentBorrows', listCurrentBorrows)

module.exports = router;

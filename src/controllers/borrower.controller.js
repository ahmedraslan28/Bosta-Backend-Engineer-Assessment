const { createBorrower, getAllBorrowers, updateBorrower, deleteBorrower, getCurrentBorrows } = require('../services/borrower.service');

async function registerBorrower(req, res, next) {
  try {
    const user = await createBorrower(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function listAllBorrowers(req, res, next) {
  try {
    const Borrowers = await getAllBorrowers(req.query);
    res.json({ success: true, data: Borrowers });
  } catch (err) {
    next(err);
  }
}

async function editBorrower(req, res, next) {
  try {
    if (Object.keys(req.body).length === 0) {
      const error = new Error('No fields provided for update');
      error.status = 400;
      throw error;
    }
    const updated = await updateBorrower(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function removeBorrower(req, res, next) {
  try {
    const result = await deleteBorrower(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function listCurrentBorrows(req, res, next) {
  try {
    const borrows = await getCurrentBorrows(req.params.id);
    res.json({ success: true, data: borrows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerBorrower,
  listAllBorrowers,
  editBorrower,
  removeBorrower,
  listCurrentBorrows
};



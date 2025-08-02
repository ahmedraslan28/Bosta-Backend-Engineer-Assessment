const { Op } = require("sequelize");
const sequelize = require("../config/db.config");
const Book = require("../models/book.model");
const Borrow = require("../models/borrow.model");
const Borrower = require("../models/borrower.model");
const User = require("../models/user.model");

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function checkOutBook(borrowerId, bookId, days) {
  return await sequelize.transaction(async (t) => {
    const book = await Book.findByPk(bookId, {
      transaction: t,
      lock: true,
    });
    if (!book || book.quantity < 1) {
      const error = new Error("Book is not available");
      error.status = 400;
      throw error;
    }

    const borrower = await Borrower.findByPk(borrowerId, {
      transaction: t,
    });
    if (!borrower) {
      const error = new Error("Borrower not found");
      error.status = 404;
      throw error;
    }

    // Fetch all active borrows (not returned)
    const activeBorrows = await Borrow.findAll({
      where: {
        borrowerId,
        returnDate: null,
      },
      transaction: t,
    });

    const today = new Date();

    // Block if any borrow is overdue
    const hasOverdue = activeBorrows.some((borrow) => {
      const due = new Date(borrow.dueDate);
      return due < today;
    });

    if (hasOverdue) {
      const error = new Error(
        "You have overdue books. Return them before borrowing more."
      );
      error.status = 409;
      throw error;
    }

    // Prevent borrowing the same book again if already active
    const duplicate = activeBorrows.find((borrow) => borrow.bookId === bookId);

    if (duplicate) {
      const error = new Error("You have already borrowed this book .");
      error.status = 409;
      throw error;
    }

    // Block if already borrowed 3 books
    if (activeBorrows.length >= 3) {
      const error = new Error("You cannot borrow more than 3 books at a time.");
      error.status = 409;
      throw error;
    }

    await book.decrement("quantity", { transaction: t });

    const borrowDate = new Date();
    const dueDate = addDays(borrowDate, days);

    const borrow = await Borrow.create(
      {
        borrowerId,
        bookId,
        borrowDate,
        dueDate,
        returnDate: null,
      },
      { transaction: t }
    );

    return borrow;
  });
}

async function returnBook(borrowId) {
  return await sequelize.transaction(async (t) => {
    const borrow = await Borrow.findByPk(borrowId, {
      transaction: t,
      lock: true,
    });

    if (!borrow) {
      const error = new Error("Borrow record not found");
      error.status = 404;
      throw error;
    }

    if (borrow.returnDate) {
      const error = new Error("Book already returned");
      error.status = 400;
      throw error;
    }

    const book = await Book.findByPk(borrow.bookId, {
      transaction: t,
      lock: true,
    });
    if (!book) {
      const error = new Error("Book record not found");
      error.status = 404;
      throw error;
    }

    await borrow.update({ returnDate: new Date() }, { transaction: t });
    await book.increment("quantity", { transaction: t });

    return { message: "Book returned successfully" };
  });
}

async function getAllBorrows(filters = {}) {
  const where = {};

  if (filters.borrowerId) {
    where.borrowerId = filters.borrowerId;
  }

  if (filters.bookId) {
    where.bookId = filters.bookId;
  }

  if (filters.returned === "true") {
    where.returnDate = { [Op.not]: null };
  }

  if (filters.returned === "false") {
    where.returnDate = null;
  }

  if (filters.overdue === "true") {
    where.returnDate = null;
    where.dueDate = { [Op.lt]: new Date() };
  }

  if (filters.borrowDateFrom || filters.borrowDateTo) {
    where.borrowDate = {};
    if (filters.borrowDateFrom) {
      where.borrowDate[Op.gte] = new Date(filters.borrowDateFrom);
    }
    if (filters.borrowDateTo) {
      where.borrowDate[Op.lte] = new Date(filters.borrowDateTo);
    }
  }

  if (filters.returnDateFrom || filters.returnDateTo) {
    where.returnDate = {};
    if (filters.returnDateFrom) {
      where.returnDate[Op.gte] = new Date(filters.returnDateFrom);
    }
    if (filters.returnDateTo) {
      where.returnDate[Op.lte] = new Date(filters.returnDateTo);
    }
  }

  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;

  const { count, rows } = await Borrow.findAndCountAll({
    where,
    include: [
      {
        model: Book,
        as: "book",
        attributes: ["title", "author"],
      },
      {
        model: Borrower,
        as: "borrower",
        include: {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
      },
    ],
    order: [["borrowDate", "DESC"]],
    limit,
    offset,
  });

  return {
    borrows: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    },
  };
}

module.exports = {
  checkOutBook,
  returnBook,
  getAllBorrows,
};

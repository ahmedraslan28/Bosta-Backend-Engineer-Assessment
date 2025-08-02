const User = require("../models/user.model");
const Borrower = require("../models/borrower.model");
const Borrow = require("../models/borrow.model");
const Book = require("../models/book.model");
const redis = require("../config/redis.config");
const sequelize = require("../config/db.config");

async function createBorrower(data) {
  return await sequelize.transaction(async (t) => {
    const existing = await User.findOne({
      where: { email: data.email },
      transaction: t,
    });
    if (existing) {
      const error = new Error("Email is already registered");
      error.status = 409;
      throw error;
    }

    const user = await User.create(
      {
        name: data.name,
        email: data.email,
      },
      { transaction: t }
    );

    const borrower = await Borrower.create(
      {
        userId: user.id,
        registeredDate: new Date(),
      },
      { transaction: t }
    );

    // Redis operations outside transaction
    const keys = await redis.keys("borrowers:*");
    if (keys.length) {
      await redis.del(...keys);
    }

    return {
      id: borrower.id,
      registeredDate: borrower.registeredDate,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  });
}

async function getAllBorrowers(filters = {}) {
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;

  const cacheKey = `borrowers:page=${page}&limit=${limit}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const { count, rows } = await Borrower.findAndCountAll({
    limit,
    offset,
    include: {
      model: User,
      as: "user",
      attributes: ["name", "email"],
    },
    order: [["id", "ASC"]],
  });

  const result = {
    borrowers: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    },
  };

  await redis.set(cacheKey, JSON.stringify(result), "EX", 60 * 3);
  return result;
}

async function updateBorrower(id, data) {
  const user = await User.findByPk(id);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (data.email && data.email !== user.email) {
    const existingEmail = await User.findOne({ where: { email: data.email } });
    if (existingEmail) {
      const error = new Error("Email is already registered");
      error.status = 409;
      throw error;
    }
  }

  await user.update({
    name: data.name ?? user.name,
    email: data.email ?? user.email,
  });

  const keys = await redis.keys("borrowers:*");
  if (keys.length) {
    await redis.del(...keys);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

async function deleteBorrower(id) {
  return await sequelize.transaction(async (t) => {
    const borrower = await Borrower.findByPk(id, {
      transaction: t,
      lock: true,
    });
    if (!borrower) {
      const error = new Error("Borrower record not found");
      error.status = 404;
      throw error;
    }

    const user = await User.findByPk(borrower.userId, {
      transaction: t,
      lock: true,
    });

    const activeBorrows = await Borrow.findOne({
      where: {
        borrowerId: borrower.id,
        returnDate: null,
      },
      transaction: t,
      lock: true,
    });

    if (activeBorrows) {
      const error = new Error("Cannot delete borrower with active borrows");
      error.status = 409;
      throw error;
    }

    // Redis operations outside transaction
    const keys = await redis.keys("borrowers:*");
    if (keys.length) {
      await redis.del(...keys);
    }

    await borrower.destroy({ transaction: t });
    await user.destroy({ transaction: t });

    return { message: "Borrower deleted successfully" };
  });
}

async function getCurrentBorrows(borrowerId) {
  const borrows = await Borrow.findAll({
    where: {
      borrowerId,
      returnDate: null,
    },
    include: [
      {
        model: Book,
        as: "book",
        attributes: ["title", "author", "isbn"],
      },
    ],
    order: [["borrowDate", "DESC"]],
  });

  return borrows;
}

module.exports = {
  createBorrower,
  getAllBorrowers,
  updateBorrower,
  deleteBorrower,
  getCurrentBorrows,
};

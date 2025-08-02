const Book = require("../models/book.model");
const { Op } = require("sequelize");
const redis = require("../config/redis.config");

exports.createBook = async (data) => {
  const existingTitle = await Book.findOne({ where: { title: data.title } });
  if (existingTitle) {
    const error = new Error("Book title must be unique");
    error.status = 409;
    throw error;
  }

  const existingIsbn = await Book.findOne({ where: { isbn: data.isbn } });
  if (existingIsbn) {
    const error = new Error("Book ISBN must be unique");
    error.status = 409;
    throw error;
  }
  const book = await Book.create(data);
  const keys = await redis.keys("books:*");
  if (keys.length) {
    await redis.del(...keys);
  }
  return book;
};

exports.editBook = async (id, data) => {
  const book = await Book.findByPk(id);
  if (!book) {
    const error = new Error("Book not found");
    error.status = 404;
    throw error;
  }

  if (data.title && data.title !== book.title) {
    const existingTitle = await Book.findOne({ where: { title: data.title } });
    if (existingTitle) {
      const error = new Error("Book title must be unique");
      error.status = 409;
      throw error;
    }
  }

  if (data.isbn && data.isbn !== book.isbn) {
    const existingIsbn = await Book.findOne({ where: { isbn: data.isbn } });
    if (existingIsbn) {
      const error = new Error("Book ISBN must be unique");
      error.status = 409;
      throw error;
    }
  }

  if (data.title && data.title === book.title) {
    const error = new Error("New title must be different from the current one");
    error.status = 400;
    throw error;
  }

  if (data.isbn && data.isbn === book.isbn) {
    const error = new Error("New isbn must be different from the current one");
    error.status = 400;
    throw error;
  }

  if (data.author && data.author === book.author) {
    const error = new Error(
      "New author must be different from the current one"
    );
    error.status = 400;
    throw error;
  }

  if (data.quantity && Number(data.quantity) === book.quantity) {
    const error = new Error(
      "New quantity must be different from the current one"
    );
    error.status = 400;
    throw error;
  }

  if (data.shelfLocation && data.shelfLocation === book.shelfLocation) {
    const error = new Error(
      "New shelf location must be different from the current one"
    );
    error.status = 400;
    throw error;
  }

  const updatedBook = await book.update(data);
  const keys = await redis.keys("books:*");
  if (keys.length) {
    await redis.del(...keys);
  }
  return updatedBook;
};

exports.removeBook = async (id) => {
  const book = await Book.findByPk(id);
  if (!book) {
    const error = new Error("Book not found");
    error.status = 404;
    throw error;
  }

  await book.destroy();

  const keys = await redis.keys("books:*");
  if (keys.length) {
    await redis.del(...keys);
  }
};

exports.getAllBooks = async (filters = {}) => {
  const cacheKey = `books:${JSON.stringify(filters)}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const where = {};

  if (filters.title) {
    where.title = { [Op.like]: `%${filters.title}%` };
  }

  if (filters.author) {
    where.author = { [Op.like]: `%${filters.author}%` };
  }

  if (filters.isbn) {
    where.isbn = { [Op.like]: `${filters.isbn}%` };
  }

  if (filters.available === "true") {
    where.quantity = { [Op.gt]: 0 };
  }

  if (filters.available === "false") {
    where.quantity = 0;
  }

  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;

  const { count, rows } = await Book.findAndCountAll({
    where,
    limit,
    offset,
  });

  const result = {
    books: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    },
  };

  await redis.set(cacheKey, JSON.stringify(result), "EX", 120);

  return result;
};

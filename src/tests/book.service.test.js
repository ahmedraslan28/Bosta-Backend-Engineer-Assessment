const {
  createBook,
  editBook,
  removeBook,
  getAllBooks,
} = require("../services/book.service");
const Book = require("../models/book.model");
const { Op } = require("sequelize");
const redis = require("../config/redis.config");

jest.mock("../models/book.model");
jest.mock("../config/redis.config", () => ({
  keys: jest.fn(),
  del: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  quit: jest.fn(),
}));

describe("Book Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redis.keys.mockResolvedValue([]);
    redis.del.mockResolvedValue(1);
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue("OK");
  });
  describe("createBook", () => {
    const mockBookData = {
      title: "Test Book",
      author: "Test Author",
      isbn: "1234567890",
      quantity: 5,
      shelfLocation: "A5",
    };

    it("should create a book successfully when title and ISBN are unique and invalidate cache", async () => {
      Book.findOne.mockResolvedValueOnce(null);
      Book.findOne.mockResolvedValueOnce(null);
      redis.keys.mockResolvedValue(["books:page=1"]);

      const mockCreatedBook = { id: 1, ...mockBookData };
      Book.create.mockResolvedValue(mockCreatedBook);

      const result = await createBook(mockBookData);

      expect(Book.findOne).toHaveBeenCalledTimes(2);
      expect(Book.findOne).toHaveBeenCalledWith({
        where: { title: mockBookData.title },
      });
      expect(Book.findOne).toHaveBeenCalledWith({
        where: { isbn: mockBookData.isbn },
      });
      expect(Book.create).toHaveBeenCalledWith(mockBookData);
      expect(redis.keys).toHaveBeenCalledWith("books:*");
      expect(redis.del).toHaveBeenCalledWith("books:page=1");
      expect(result).toEqual(mockCreatedBook);
    });

    it("should throw error when title already exists", async () => {
      Book.findOne.mockResolvedValueOnce({ id: 1, title: mockBookData.title });

      await expect(createBook(mockBookData)).rejects.toThrow(
        "Book title must be unique"
      );

      expect(Book.findOne).toHaveBeenCalledTimes(1);
      expect(Book.findOne).toHaveBeenCalledWith({
        where: { title: mockBookData.title },
      });
      expect(Book.create).not.toHaveBeenCalled();
    });

    it("should throw error when ISBN already exists", async () => {
      Book.findOne.mockResolvedValueOnce(null);
      Book.findOne.mockResolvedValueOnce({ id: 2, isbn: mockBookData.isbn });

      await expect(createBook(mockBookData)).rejects.toThrow(
        "Book ISBN must be unique"
      );

      expect(Book.findOne).toHaveBeenCalledTimes(2);
      expect(Book.findOne).toHaveBeenCalledWith({
        where: { title: mockBookData.title },
      });
      expect(Book.findOne).toHaveBeenCalledWith({
        where: { isbn: mockBookData.isbn },
      });
      expect(Book.create).not.toHaveBeenCalled();
    });
  });
  describe("editBook", () => {
    const mockBook = {
      id: 1,
      title: "Original Title",
      author: "Original Author",
      isbn: "1234567890",
      quantity: 5,
      shelfLocation: "A1",
      update: jest.fn(),
    };

    describe("Book not found", () => {
      it("should throw 404 error when book is not found", async () => {
        Book.findByPk.mockResolvedValue(null);

        await expect(
          editBook(999, { title: "New Title" })
        ).rejects.toMatchObject({
          message: "Book not found",
          status: 404,
        });

        expect(Book.findByPk).toHaveBeenCalledWith(999);
      });
    });

    describe("Title validation", () => {
      beforeEach(() => {
        Book.findByPk.mockResolvedValue(mockBook);
      });

      it("should throw 409 error when new title already exists", async () => {
        const existingBook = { id: 2, title: "Existing Title" };
        Book.findOne.mockResolvedValue(existingBook);

        await expect(
          editBook(1, { title: "Existing Title" })
        ).rejects.toMatchObject({
          message: "Book title must be unique",
          status: 409,
        });

        expect(Book.findOne).toHaveBeenCalledWith({
          where: { title: "Existing Title" },
        });
      });

      it("should throw 400 error when new title is same as current title", async () => {
        Book.findOne.mockResolvedValue(null);

        await expect(
          editBook(1, { title: "Original Title" })
        ).rejects.toMatchObject({
          message: "New title must be different from the current one",
          status: 400,
        });
      });
    });

    describe("ISBN validation", () => {
      beforeEach(() => {
        Book.findByPk.mockResolvedValue(mockBook);
      });

      it("should throw 409 error when new ISBN already exists", async () => {
        const existingBook = { id: 2, isbn: "9876543210" };
        Book.findOne.mockResolvedValue(existingBook);

        await expect(editBook(1, { isbn: "9876543210" })).rejects.toMatchObject(
          {
            message: "Book ISBN must be unique",
            status: 409,
          }
        );

        expect(Book.findOne).toHaveBeenCalledWith({
          where: { isbn: "9876543210" },
        });
      });

      it("should throw 400 error when new ISBN is same as current ISBN", async () => {
        Book.findOne.mockResolvedValue(null);

        await expect(editBook(1, { isbn: "1234567890" })).rejects.toMatchObject(
          {
            message: "New isbn must be different from the current one",
            status: 400,
          }
        );
      });
    });

    describe("Author validation", () => {
      beforeEach(() => {
        Book.findByPk.mockResolvedValue(mockBook);
      });

      it("should throw 400 error when new author is same as current author", async () => {
        await expect(
          editBook(1, { author: "Original Author" })
        ).rejects.toMatchObject({
          message: "New author must be different from the current one",
          status: 400,
        });
      });
    });

    describe("Quantity validation", () => {
      beforeEach(() => {
        Book.findByPk.mockResolvedValue(mockBook);
      });

      it("should throw 400 error when new quantity as string is same as current quantity", async () => {
        await expect(editBook(1, { quantity: "5" })).rejects.toMatchObject({
          message: "New quantity must be different from the current one",
          status: 400,
        });
      });
    });

    describe("Shelf location validation", () => {
      beforeEach(() => {
        Book.findByPk.mockResolvedValue(mockBook);
      });

      it("should throw 400 error when new shelf location is same as current shelf location", async () => {
        await expect(
          editBook(1, { shelfLocation: "A1" })
        ).rejects.toMatchObject({
          message: "New shelf location must be different from the current one",
          status: 400,
        });
      });
    });

    describe("Multiple field updates", () => {
      beforeEach(() => {
        Book.findByPk.mockResolvedValue(mockBook);
      });

      it("should successfully update multiple fields when all validations pass", async () => {
        Book.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

        const updatedBook = {
          ...mockBook,
          title: "New Title",
          author: "New Author",
          isbn: "9876543210",
          quantity: 10,
          shelfLocation: "B2",
        };

        mockBook.update.mockResolvedValue(updatedBook);

        const updateData = {
          title: "New Title",
          author: "New Author",
          isbn: "9876543210",
          quantity: 10,
          shelfLocation: "B2",
        };

        redis.keys.mockResolvedValue(["books:page=1"]);
        const result = await editBook(1, updateData);

        expect(Book.findOne).toHaveBeenCalledWith({
          where: { title: "New Title" },
        });
        expect(Book.findOne).toHaveBeenCalledWith({
          where: { isbn: "9876543210" },
        });
        expect(mockBook.update).toHaveBeenCalledWith(updateData);
        expect(redis.keys).toHaveBeenCalledWith("books:*");
        expect(redis.del).toHaveBeenCalledWith("books:page=1");
        expect(result).toEqual(updatedBook);
        expect(result.title).toBe(updatedBook.title);
        expect(result.author).toBe(updatedBook.author);
        expect(result.isbn).toBe(updatedBook.isbn);
        expect(result.shelfLocation).toBe(updatedBook.shelfLocation);
        expect(result.quantity).toBe(updatedBook.quantity);
      });
    });
  });
  describe("removeBook", () => {
    const mockBook = {
      id: 1,
      title: "Test Book",
      author: "Test Author",
      isbn: "1234567890",
      quantity: 5,
      shelfLocation: "A1",
      destroy: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should throw 404 error when book does not exist", async () => {
      Book.findByPk.mockResolvedValue(null);

      await expect(removeBook(999)).rejects.toMatchObject({
        message: "Book not found",
        status: 404,
      });

      expect(Book.findByPk).toHaveBeenCalledWith(999);
      expect(Book.destroy).not.toHaveBeenCalled();
    });

    it("should successfully remove an existing book and invalidate cache", async () => {
      Book.findByPk.mockResolvedValue(mockBook);
      mockBook.destroy.mockResolvedValue();
      redis.keys.mockResolvedValue(["books:page=1"]);

      const result = await removeBook(1);

      expect(Book.findByPk).toHaveBeenCalledWith(1);
      expect(mockBook.destroy).toHaveBeenCalled();
      expect(redis.keys).toHaveBeenCalledWith("books:*");
      expect(redis.del).toHaveBeenCalledWith("books:page=1");
      expect(result).toBeUndefined();
    });
  });

  describe("Book Service - getAllBooks", () => {
    beforeEach(() => {
      Book.findAndCountAll.mockReset();
      redis.get.mockReset();
      redis.set.mockReset();
    });

    it("should return cached results when available", async () => {
      const cachedData = {
        books: [
          {
            id: 1,
            title: "Cached Book",
            author: "Cached Author",
            isbn: "12345",
            quantity: 10,
          },
        ],
        pagination: {
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          pageSize: 10,
        },
      };
      redis.get.mockResolvedValue(JSON.stringify(cachedData));

      const filters = {};
      const result = await getAllBooks(filters);

      expect(redis.get).toHaveBeenCalledWith("books:{}");
      expect(Book.findAndCountAll).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it("should fetch from database and cache when no cache exists", async () => {
      const mockBooks = [
        {
          id: 1,
          title: "Book 1",
          author: "Author 1",
          isbn: "12345",
          quantity: 10,
          shelfLocation: "A5",
        },
        {
          id: 2,
          title: "Book 2",
          author: "Author 2",
          isbn: "67890",
          quantity: 5,
          shelfLocation: "A5",
        },
      ];
      Book.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockBooks,
      });

      const filters = {};
      const result = await getAllBooks(filters);

      const expectedResult = {
        books: mockBooks,
        pagination: {
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          pageSize: 10,
        },
      };

      expect(redis.get).toHaveBeenCalledWith("books:{}");
      expect(Book.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: 10,
        offset: 0,
      });
      expect(redis.set).toHaveBeenCalledWith(
        "books:{}",
        JSON.stringify(expectedResult),
        "EX",
        120
      );
      expect(result).toEqual(expectedResult);
    });

    it("should return books filtered by title", async () => {
      const mockBooks = [
        {
          id: 1,
          title: "Book 1",
          author: "Author 1",
          isbn: "12345",
          quantity: 10,
        },
      ];
      Book.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockBooks,
      });

      const filters = { title: "Book 1" };
      const result = await getAllBooks(filters);

      expect(Book.findAndCountAll).toHaveBeenCalledWith({
        where: {
          title: { [Op.like]: "%Book 1%" },
        },
        limit: 10,
        offset: 0,
      });
      expect(result.books).toBe(mockBooks);
    });

    it("should return books filtered by author", async () => {
      const mockBooks = [
        {
          id: 1,
          title: "Book 1",
          author: "Author 1",
          isbn: "12345",
          quantity: 10,
        },
      ];
      Book.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockBooks,
      });

      const filters = { author: "Author 1" };
      const result = await getAllBooks(filters);

      expect(Book.findAndCountAll).toHaveBeenCalledWith({
        where: {
          author: { [Op.like]: "%Author 1%" },
        },
        limit: 10,
        offset: 0,
      });
      expect(result.books).toEqual(mockBooks);
    });

    it("should return books filtered by ISBN", async () => {
      const mockBooks = [
        {
          id: 1,
          title: "Book 1",
          author: "Author 1",
          isbn: "12345",
          quantity: 10,
        },
      ];
      Book.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockBooks,
      });

      const filters = { isbn: "12345" };
      const result = await getAllBooks(filters);

      expect(Book.findAndCountAll).toHaveBeenCalledWith({
        where: {
          isbn: { [Op.like]: "12345%" },
        },
        limit: 10,
        offset: 0,
      });
      expect(result.books).toEqual(mockBooks);
    });

    it("should return available books when 'available' filter is true", async () => {
      const mockBooks = [
        {
          id: 1,
          title: "Book 1",
          author: "Author 1",
          isbn: "12345",
          quantity: 10,
        },
      ];
      Book.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockBooks,
      });

      const filters = { available: "true" };
      const result = await getAllBooks(filters);

      expect(Book.findAndCountAll).toHaveBeenCalledWith({
        where: {
          quantity: { [Op.gt]: 0 },
        },
        limit: 10,
        offset: 0,
      });
      expect(result.books).toEqual(mockBooks);
    });

    it("should return unavailable books when 'available' filter is false", async () => {
      const mockBooks = [
        {
          id: 1,
          title: "Book 1",
          author: "Author 1",
          isbn: "12345",
          quantity: 0,
        },
      ];
      Book.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockBooks,
      });

      const filters = { available: "false" };
      const result = await getAllBooks(filters);

      expect(Book.findAndCountAll).toHaveBeenCalledWith({
        where: {
          quantity: 0,
        },
        limit: 10,
        offset: 0,
      });
      expect(result.books).toEqual(mockBooks);
    });

    it("should paginate results correctly", async () => {
      const mockBooks = [
        {
          id: 1,
          title: "Book 1",
          author: "Author 1",
          isbn: "12345",
          quantity: 10,
        },
        {
          id: 2,
          title: "Book 2",
          author: "Author 2",
          isbn: "67890",
          quantity: 5,
        },
      ];
      Book.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: [mockBooks[1]],
      });

      const filters = { page: "2", limit: "1" };
      const result = await getAllBooks(filters);

      expect(Book.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: 1,
        offset: 1,
      });
      expect(result.books).toEqual([mockBooks[1]]);
      expect(result.pagination.totalItems).toBe(2);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.pageSize).toBe(1);
    });
  });
});

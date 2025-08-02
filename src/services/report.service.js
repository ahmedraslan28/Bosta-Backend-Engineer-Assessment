const Borrow = require("../models/borrow.model");
const Book = require("../models/book.model");
const Borrower = require("../models/borrower.model");
const User = require("../models/user.model");
const { createObjectCsvWriter } = require("csv-writer");
const path = require("path");
const { Op } = require("sequelize");

async function generatePeriodReportCSV(from, to) {
  const borrows = await Borrow.findAll({
    where: {
      borrowDate: {
        [Op.between]: [new Date(from), new Date(to)],
      },
    },
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
  });

  if (borrows.length === 0) return null;

  const records = borrows.map((b) => ({
    borrowerName: b.borrower.user.name,
    borrowerEmail: b.borrower.user.email,
    bookTitle: b.book.title,
    bookAuthor: b.book.author,
    borrowDate: b.borrowDate,
    dueDate: b.dueDate,
    returnDate: b.returnDate || "Not returned",
  }));

  console.log(borrows);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(
    __dirname,
    `../../exports/borrows-by-period/borrows_report_${timestamp}.csv`
  );
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: "borrowerName", title: "Borrower Name" },
      { id: "borrowerEmail", title: "Borrower Email" },
      { id: "bookTitle", title: "Book Title" },
      { id: "bookAuthor", title: "Book Author" },
      { id: "borrowDate", title: "Borrow Date" },
      { id: "dueDate", title: "Due Date" },
      { id: "returnDate", title: "Return Date" },
    ],
  });

  await csvWriter.writeRecords(records);
  return filePath;
}

async function generateOverdueBorrowsLastMonth() {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  const borrows = await Borrow.findAll({
    where: {
      returnDate: null,
      dueDate: {
        [Op.lt]: today,
        [Op.gte]: lastMonth,
      },  
    },
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
  });

if (borrows.length === 0) return null;
  const records = borrows.map((b) => ({
    borrowerName: b.borrower.user.name,
    borrowerEmail: b.borrower.user.email,
    bookTitle: b.book.title,
    borrowDate: b.borrowDate,
    dueDate: b.dueDate,
    returnDate: b.returnDate || "Not returned",
  }));

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(
    __dirname,
    `../../exports/overdue-last-month/overdue_last_month_${timestamp}.csv`
  );
  const writer = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: "borrowerName", title: "Borrower Name" }, 
      { id: "borrowerEmail", title: "Borrower Email" }, 
      { id: "bookTitle", title: "Book Title" }, 
      { id: "borrowDate", title: "Borrow Date" },
      { id: "dueDate", title: "Due Date" },
      { id: "returnDate", title: "Return Date" }, 
    ],
  });

  await writer.writeRecords(records);
  return filePath;
}

async function generateAllBorrowsLastMonth() {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  const borrows = await Borrow.findAll({
    where: {
      borrowDate: {
        [Op.gte]: lastMonth,
        [Op.lte]: today,
      },
    },
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
  });

  if (borrows.length === 0) return null;

  const records = borrows.map((b) => ({
    borrowerName: b.borrower.user.name,
    borrowerEmail: b.borrower.user.email,
    bookTitle: b.book.title,
    borrowDate: b.borrowDate,
    dueDate: b.dueDate,
    returnDate: b.returnDate || "Not returned",
  }));

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(
    __dirname,
    `../../exports/borrows-last-month/borrows_last_month_${timestamp}.csv`
  );

  const writer = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: "borrowerName", title: "Borrower Name" }, 
      { id: "borrowerEmail", title: "Borrower Email" }, 
      { id: "bookTitle", title: "Book Title" }, 
      { id: "borrowDate", title: "Borrow Date" },
      { id: "dueDate", title: "Due Date" },
      { id: "returnDate", title: "Return Date" }, 
    ],
  });

  await writer.writeRecords(records);
  return filePath;
}

module.exports = {
  generatePeriodReportCSV,
  generateOverdueBorrowsLastMonth,
  generateAllBorrowsLastMonth,
};
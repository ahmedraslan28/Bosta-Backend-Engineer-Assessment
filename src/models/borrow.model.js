const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Book = require('./book.model');
const Borrower = require('./borrower.model');

const Borrow = sequelize.define('Borrow', {
  borrowDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  returnDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  bookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'books', 
      key: 'id',
    },
  },
  borrowerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'borrowers', 
      key: 'id',
    },
  },
}, {
  tableName: 'borrows',
  timestamps: false,
});

Borrow.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });
Book.hasMany(Borrow, { foreignKey: 'bookId' });

Borrow.belongsTo(Borrower, { foreignKey: 'borrowerId', as: 'borrower' });
Borrower.hasMany(Borrow, { foreignKey: 'borrowerId' });

module.exports = Borrow;

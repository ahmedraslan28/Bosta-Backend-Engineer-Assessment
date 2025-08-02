const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Book = sequelize.define('Book', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isbn: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, 
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  shelfLocation: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'books',
  timestamps: false,
  indexes: [
    {
      name: 'idx_author',
      fields: ['author'],
    },
  ],
});


module.exports = Book;

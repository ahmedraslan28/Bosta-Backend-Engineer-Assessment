const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const User = require("../models/user.model")

const Librarian = sequelize.define('Librarian', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  tableName: 'librarians',
  timestamps: false,
});
Librarian.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
User.hasOne(Librarian, { foreignKey: 'userId', as: 'librarian' });
module.exports = Librarian;

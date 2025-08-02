const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const User = require("../models/user.model")

const Borrower  = sequelize.define('Borrower', {
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
  registeredDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue : DataTypes.NOW
  },
}, {
  tableName: 'borrowers',
  timestamps: false,
});

Borrower.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
User.hasOne(Borrower, { foreignKey: 'userId', as: 'borrower' });

module.exports = Borrower;

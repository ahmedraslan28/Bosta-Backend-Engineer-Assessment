require('dotenv').config();
const bcrypt = require('bcrypt');
const sequelize = require('../config/db.config');
const User = require('../models/user.model');
const Librarian = require('../models/librarian.model');

async function seedAdmin() {
  try {
    await sequelize.sync();

    const existingUser = await User.findOne({ where: { email: 'admin@example.com' } });
    if (existingUser) return;

    const user = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
    });

    const hashedPassword = await bcrypt.hash('secret123', 10);

    await Librarian.create({
      userId: user.id,
      password: hashedPassword,
    });

    console.log('Admin seeded');
  } catch (err) {
    console.error('Failed to seed admin:', err);
  } finally {
    await sequelize.close();
  }
}

seedAdmin();

require("dotenv").config();
const app = require("./src/app");
const sequelize = require("./src/config/db.config");

const PORT = process.env.PORT || 3000;

require("./src/models/borrower.model");
require("./src/models/book.model");
require("./src/models/borrow.model");
const User = require("./src/models/user.model");
const Librarian = require("./src/models/librarian.model");
const bcrypt = require("bcrypt");

async function seedAdmin() {
  try {
    const existingUser = await User.findOne({
      where: { email: "admin@example.com" },
    });
    if (existingUser) return;

    const user = await User.create({
      name: "Admin",
      email: "admin@example.com",
    });

    const hashedPassword = await bcrypt.hash("secret123", 10);

    await Librarian.create({
      userId: user.id,
      password: hashedPassword,
    });

    console.log("Admin seeded");
  } catch (err) {
    console.error("Failed to seed admin:", err);
  }
}

async function start() {
  try {
    await sequelize.authenticate();
    console.log("DB connected successfully");

    await sequelize.sync();
    console.log("Models synced with DB");

    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to DB:", error);
  }
}

start();

require("dotenv").config();
const app = require("./src/app");
const sequelize = require("./src/config/db.config");
const bcrypt = require("bcrypt");

const PORT = process.env.PORT || 3000;

require("./src/models/borrower.model");
require("./src/models/book.model");
require("./src/models/borrow.model");
const User = require("./src/models/user.model");
const Librarian = require("./src/models/librarian.model");

async function connectWithRetry() {
  const maxRetries = 10;
  const baseDelay = 2000; 
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
      
      await sequelize.authenticate();
      console.log("Database connected successfully");
      return true;
    } catch (error) {
      console.error(`Connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error("Max connection attempts reached. Exiting...");
        throw new Error(`Failed to connect to database after ${maxRetries} attempts`);
      }
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 30000);
      console.log(`Retrying in ${delay / 1000} seconds...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function syncModels() {
  try {
    console.log("Synchronizing database models...");
    
    await sequelize.sync();
    
    console.log("Models synchronized successfully");
  } catch (error) {
    console.error("Model synchronization failed:", error);
    throw error;
  }
}

async function seedAdmin() {
  try {
    console.log("Checking admin user...");
    
    const existingUser = await User.findOne({
      where: { email: "admin@example.com" },
    });
    
    if (existingUser) {
      console.log("Admin user already exists");
      return;
    }

    console.log("Creating admin user...");
    const user = await User.create({
      name: "Admin",
      email: "admin@example.com",
    });

    const hashedPassword = await bcrypt.hash("secret123", 10);

    await Librarian.create({
      userId: user.id,
      password: hashedPassword,
    });

    console.log("Admin user created successfully");
  } catch (error) {
    console.error("Failed to seed admin:", error);
    throw error;
  }
}

async function startServer() {
  try {
    console.log("🚀 Starting server...");
    
    await connectWithRetry();
    
    await syncModels();
    
    await seedAdmin();
    
    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
    
    
  } catch (error) {
    console.error("Failed to start server:", error);

    console.log("Shutting down due to startup failure...");
    process.exit(1);
  }
}
startServer();
require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/db.config');

const PORT = process.env.PORT || 3000;

require('./src/models/borrower.model');
require('./src/models/book.model');
require('./src/models/librarian.model');
require('./src/models/user.model');
require('./src/models/borrow.model');

async function start() {
  try {
    await sequelize.authenticate();
    console.log('DB connected successfully');

    await sequelize.sync(); 
    console.log('Models synced with DB');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to DB:', error);
  }
}

start();

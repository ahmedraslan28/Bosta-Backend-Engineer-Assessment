const basicAuth = require('basic-auth');
const bcrypt = require('bcrypt');
const Librarian = require('../models/librarian.model');

module.exports = async function authMiddleware(req, res, next) {
  // next() ;
  const credentials = basicAuth(req);
  if (!credentials || !credentials.name || !credentials.pass) {
    return res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
  }

  try {
    const librarian = await Librarian.findOne({ where: { '$user.email$': credentials.name }, include: 'user' });

    if (!librarian) {
      return res.status(403).json({ success: false, message: 'Access denied: librarian only' });
    }

    const passwordMatch = await bcrypt.compare(credentials.pass, librarian.password);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    req.user = librarian;
    next();
  } catch (err) {
    next(err);
  }
};

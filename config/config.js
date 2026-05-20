const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  session: {
    secret: process.env.SESSION_SECRET || 'bitkok-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 saat
  },
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    dest: path.join(__dirname, '..', 'public', 'uploads')
  },
  data: {
    contentPath: path.join(__dirname, '..', 'data', 'content.json'),
    usersPath: path.join(__dirname, '..', 'data', 'users.json')
  }
};

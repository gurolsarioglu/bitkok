const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./config/config');

const app = express();

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session(config.session));

// Routes
app.use('/', require('./routes/frontend.routes'));
app.use('/admin', require('./routes/admin.routes'));

// Start
app.listen(config.port, () => {
  console.log(`\n  🌿 Bitkok MVC Server`);
  console.log(`  ├─ Vitrin:  http://localhost:${config.port}`);
  console.log(`  └─ Admin:   http://localhost:${config.port}/admin\n`);
});

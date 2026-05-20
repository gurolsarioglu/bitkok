const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const config = require('./config/config');

const app = express();

// Güvenlik başlıkları
app.use(helmet({
  contentSecurityPolicy: false, // EJS inline scriptler için
  crossOriginEmbedderPolicy: false
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  ...config.session,
  cookie: {
    ...config.session.cookie,
    httpOnly: true,    // XSS koruması
    sameSite: 'lax',   // CSRF koruması
    secure: process.env.NODE_ENV === 'production' // HTTPS'de secure
  }
}));

// Routes
const themeCtrl = require('./controllers/theme.controller');
app.get('/css/theme.css', themeCtrl.generateThemeCSS);
app.use('/', require('./routes/frontend.routes'));
app.use('/admin', require('./routes/admin.routes'));

// Start
app.listen(config.port, () => {
  console.log(`\n  🌿 Bitkok MVC Server`);
  console.log(`  ├─ Vitrin:  http://localhost:${config.port}`);
  console.log(`  └─ Admin:   http://localhost:${config.port}/admin\n`);
});

const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/admin.controller');
const contactCtrl = require('../controllers/contact.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Auth
router.get('/login', adminCtrl.loginPage);
router.post('/login', adminCtrl.login);
router.get('/logout', adminCtrl.logout);

// Dashboard (auth gerekli)
router.get('/', requireAuth, adminCtrl.dashboard);
router.get('/edit/:section', requireAuth, adminCtrl.editSection);

// API endpoints (AJAX)
router.post('/api/section/:section', requireAuth, express.json(), adminCtrl.updateSection);
router.post('/api/save', requireAuth, express.json(), adminCtrl.saveAll);
router.post('/api/upload/:category', requireAuth, upload.single('image'), adminCtrl.uploadImage);
router.post('/api/change-password', requireAuth, express.json(), adminCtrl.changePassword);

// Mesaj yönetimi API
router.get('/api/messages', requireAuth, contactCtrl.getMessages);
router.post('/api/messages/:id/read', requireAuth, contactCtrl.markRead);
router.delete('/api/messages/:id', requireAuth, contactCtrl.deleteMessage);
router.post('/api/test-email', requireAuth, contactCtrl.testEmail);

module.exports = router;

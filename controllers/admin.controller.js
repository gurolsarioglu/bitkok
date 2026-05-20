const contentModel = require('../models/content.model');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

/** Login sayfası */
exports.loginPage = (req, res) => {
  if (req.session && req.session.admin) return res.redirect('/admin');
  res.render('admin/login', { error: null });
};

/** Login işlemi */
exports.login = (req, res) => {
  const { username, password } = req.body;
  const usersData = JSON.parse(fs.readFileSync(config.data.usersPath, 'utf-8'));
  const user = usersData.admin.find(u => u.username === username);

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.admin = { username: user.username, role: user.role };
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: 'Kullanıcı adı veya şifre hatalı' });
};

/** Çıkış */
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
};

/** Dashboard */
exports.dashboard = (req, res) => {
  const content = contentModel.getAll();
  res.render('admin/dashboard', { content, section: 'overview', admin: req.session.admin });
};

/** Bölüm düzenleme sayfası */
exports.editSection = (req, res) => {
  const { section } = req.params;
  const content = contentModel.getAll();
  const validSections = ['hero', 'solutions', 'story', 'research', 'blog', 'contact', 'settings', 'navbar', 'footer', 'design'];
  if (!validSections.includes(section)) return res.redirect('/admin');
  res.render('admin/dashboard', { content, section, admin: req.session.admin });
};

/** Bölüm güncelleme (AJAX) */
exports.updateSection = (req, res) => {
  const { section } = req.params;
  try {
    const updated = contentModel.updateSection(section, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/** Görsel yükleme */
exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Dosya yüklenemedi' });
  }
  const category = req.params.category;
  const filePath = `/uploads/${category}/${req.file.filename}`;
  res.json({ success: true, path: filePath });
};

/** Tüm content.json'u kaydet (toplu güncelleme) */
exports.saveAll = (req, res) => {
  try {
    const { section, data } = req.body;
    const updated = contentModel.updateSection(section, data);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

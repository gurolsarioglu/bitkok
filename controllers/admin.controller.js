const contentModel = require('../models/content.model');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const Jimp = require('jimp');

/* =============================================
   BRUTE-FORCE KORUMASI
   ============================================= */
const loginAttempts = new Map(); // IP -> { count, lastAttempt }
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function checkLoginLimit(ip) {
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };
  
  const elapsed = (Date.now() - record.lastAttempt) / 1000 / 60;
  if (elapsed > LOCKOUT_MINUTES) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }
  if (record.count >= MAX_ATTEMPTS) {
    const remaining = Math.ceil(LOCKOUT_MINUTES - elapsed);
    return { allowed: false, remaining };
  }
  return { allowed: true };
}

function recordFailedLogin(ip) {
  const record = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  record.count++;
  record.lastAttempt = Date.now();
  loginAttempts.set(ip, record);
}

function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

/* =============================================
   AUTH ENDPOINTS
   ============================================= */

/** Login sayfası */
exports.loginPage = (req, res) => {
  if (req.session && req.session.admin) return res.redirect('/admin');
  res.render('admin/login', { error: null, info: null });
};

/** Login işlemi */
exports.login = (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Rate limiting kontrolü
  const limit = checkLoginLimit(ip);
  if (!limit.allowed) {
    return res.render('admin/login', { 
      error: `Çok fazla başarısız giriş denemesi. ${limit.remaining} dakika sonra tekrar deneyin.`,
      info: null
    });
  }

  const { username, password } = req.body;
  const usersData = JSON.parse(fs.readFileSync(config.data.usersPath, 'utf-8'));
  const user = usersData.admin.find(u => u.username === username);

  if (user && bcrypt.compareSync(password, user.password)) {
    clearLoginAttempts(ip);
    
    // Session regenerate - session fixation koruması
    req.session.regenerate((err) => {
      req.session.admin = { username: user.username, role: user.role };
      req.session.loginTime = new Date().toISOString();
      req.session.save(() => {
        res.redirect('/admin');
      });
    });
    return;
  }

  recordFailedLogin(ip);
  const attemptsLeft = MAX_ATTEMPTS - (loginAttempts.get(ip)?.count || 0);
  
  res.render('admin/login', { 
    error: attemptsLeft > 0 
      ? `Kullanıcı adı veya şifre hatalı. ${attemptsLeft} deneme hakkınız kaldı.`
      : `Hesabınız ${LOCKOUT_MINUTES} dakika süreyle kilitlendi.`,
    info: null
  });
};

/** Çıkış */
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
};

/* =============================================
   DASHBOARD & EDIT
   ============================================= */

/** Dashboard */
exports.dashboard = (req, res) => {
  const content = contentModel.getAll();
  res.render('admin/dashboard', { content, section: 'overview', admin: req.session.admin });
};

/** Bölüm düzenleme sayfası */
exports.editSection = (req, res) => {
  const { section } = req.params;
  const content = contentModel.getAll();
  const validSections = ['hero', 'solutions', 'story', 'research', 'blog', 'contact', 'settings', 'navbar', 'footer', 'design', 'security'];
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

/** Görsel yükleme (Logo için arka plan temizleme ile) */
exports.uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Dosya yüklenemedi' });
  }
  const category = req.params.category;
  let filePath = `/uploads/${category}/${req.file.filename}`;

  try {
    if (category === 'logo') {
      const fullPath = req.file.path;
      // Sadece resim dosyaları için Jimp işle
      if (req.file.mimetype.startsWith('image/') && req.file.mimetype !== 'image/svg+xml') {
        const image = await Jimp.read(fullPath);
        let needsProcessing = false;

        // Toleranslı beyaz arka plan temizliği
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
          const red = this.bitmap.data[idx + 0];
          const green = this.bitmap.data[idx + 1];
          const blue = this.bitmap.data[idx + 2];
          const alpha = this.bitmap.data[idx + 3];

          // Beyaz veya beyaza çok yakın olan ve transparan olmayan pikselleri transparan yap
          if (alpha > 0 && red > 230 && green > 230 && blue > 230) {
            this.bitmap.data[idx + 3] = 0; // Transparan
            needsProcessing = true;
          }
        });

        // Eğer işlem yapıldıysa veya JPG ise, her zaman PNG olarak kaydet
        if (needsProcessing || req.file.mimetype === 'image/jpeg') {
           const newFilename = req.file.filename.replace(/\.[^/.]+$/, "") + ".png";
           const newFullPath = path.join(path.dirname(fullPath), newFilename);
           await image.writeAsync(newFullPath);
           
           if (fullPath !== newFullPath) {
             fs.unlinkSync(fullPath);
           }
           filePath = `/uploads/${category}/${newFilename}`;
        }
      }
    }
    
    res.json({ success: true, path: filePath });
  } catch (err) {
    console.error("Görsel işleme hatası:", err);
    // Hata olsa bile normal dosyayı döndür
    res.json({ success: true, path: filePath });
  }
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

/* =============================================
   ŞİFRE YÖNETİMİ
   ============================================= */

/** Şifre değiştirme */
exports.changePassword = (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  // Validasyonlar
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.json({ success: false, error: 'Tüm alanları doldurun.' });
  }
  if (newPassword.length < 6) {
    return res.json({ success: false, error: 'Yeni şifre en az 6 karakter olmalı.' });
  }
  if (newPassword !== confirmPassword) {
    return res.json({ success: false, error: 'Yeni şifreler eşleşmiyor.' });
  }

  try {
    const usersData = JSON.parse(fs.readFileSync(config.data.usersPath, 'utf-8'));
    const userIndex = usersData.admin.findIndex(u => u.username === req.session.admin.username);
    
    if (userIndex === -1) {
      return res.json({ success: false, error: 'Kullanıcı bulunamadı.' });
    }

    // Mevcut şifre kontrolü
    if (!bcrypt.compareSync(currentPassword, usersData.admin[userIndex].password)) {
      return res.json({ success: false, error: 'Mevcut şifre hatalı.' });
    }

    // Yeni şifreyi hashle ve kaydet
    usersData.admin[userIndex].password = bcrypt.hashSync(newPassword, 10);
    usersData.admin[userIndex].lastPasswordChange = new Date().toISOString();
    fs.writeFileSync(config.data.usersPath, JSON.stringify(usersData, null, 2), 'utf-8');

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: 'Şifre değiştirilemedi: ' + err.message });
  }
};

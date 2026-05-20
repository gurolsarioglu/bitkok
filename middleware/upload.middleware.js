const multer = require('multer');
const path = require('path');
const config = require('../config/config');

/** Dinamik hedef dizinli storage */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Route'tan gelen kategori: logo, hero, story, blog
    const category = req.params.category || 'general';
    const dest = path.join(config.upload.dest, category);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = req.params.category || 'file';
    // Benzersiz dosya adı: hero-1716123456789.png
    cb(null, `${name}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya formatı'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxFileSize }
});

module.exports = upload;

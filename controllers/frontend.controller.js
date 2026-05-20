const contentModel = require('../models/content.model');

/** Vitrin ana sayfa */
exports.index = (req, res) => {
  const content = contentModel.getAll();
  res.render('frontend/index', { content });
};

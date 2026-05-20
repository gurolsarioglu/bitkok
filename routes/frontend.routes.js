const express = require('express');
const router = express.Router();
const frontendCtrl = require('../controllers/frontend.controller');
const contactCtrl = require('../controllers/contact.controller');

router.get('/', frontendCtrl.index);
router.post('/contact', express.json(), contactCtrl.submitContact);

module.exports = router;

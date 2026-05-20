const express = require('express');
const router = express.Router();
const frontendCtrl = require('../controllers/frontend.controller');

router.get('/', frontendCtrl.index);

module.exports = router;

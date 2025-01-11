const express = require('express');
const router = express.Router();
const { getFinancialData } = require('../models/fetchDataController');

router.get('/', getFinancialData);

module.exports = router;
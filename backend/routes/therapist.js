const express = require('express');
const router = express.Router();
const { getTherapists } = require('../controllers/therapistController');

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Therapist route is working!' });
});

router.get('/', getTherapists);
module.exports = router;
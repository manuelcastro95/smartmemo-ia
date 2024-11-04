const express = require('express');
const {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
} = require('../controllers/meetingController');
const authMiddleware = require('../middlewares/authMiddleware'); // Importar el middleware

const router = express.Router();

// Rutas CRUD para las reuniones protegidas con el middleware
router.post('/', authMiddleware, createMeeting);
router.get('/', authMiddleware, getMeetings);
router.get('/:id', authMiddleware, getMeetingById);
router.put('/:id', authMiddleware, updateMeeting);
router.delete('/:id', authMiddleware, deleteMeeting);

module.exports = router;

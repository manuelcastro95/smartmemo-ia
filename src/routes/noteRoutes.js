const express = require('express');
const {
  createNote,
  getNotesByMeeting,
  deleteNote,
} = require('../controllers/noteController');
const authMiddleware = require('../middlewares/authMiddleware'); // Importar el middleware

const router = express.Router();

// Rutas CRUD para las anotaciones protegidas con el middleware
router.post('/', authMiddleware, createNote);
router.get('/:meetingId', authMiddleware, getNotesByMeeting);
router.delete('/:id', authMiddleware, deleteNote);

module.exports = router;

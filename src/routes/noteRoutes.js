const express = require('express');
const {
  createNote,
  getNotesByTranscription,
  deleteNote,
  getNoteById
} = require('../controllers/noteController');
const authMiddleware = require('../middlewares/authMiddleware'); // Importar el middleware

const router = express.Router();

// Rutas para las notas protegidas con el middleware
router.post('/', authMiddleware, createNote);

//traer nota de una reunion
router.get('/:noteId', authMiddleware, getNoteById);

//traer nota de una transcription
router.get('/:transcriptionId', authMiddleware, getNotesByTranscription);

//eliminar una nota
router.delete('/:id', authMiddleware, deleteNote);

module.exports = router;

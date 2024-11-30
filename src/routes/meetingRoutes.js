const express = require('express');
const { createMeeting, getMeetings, getMeetingById, updateMeeting, deleteMeeting, getTranscriptionsByMeeting, uploadToS3 } = require('../controllers/meetingController');
const { generateTranscription, getTranscriptionAsConversation } = require('../controllers/transcriptionController');
const authMiddleware = require('../middlewares/authMiddleware'); 
const multer = require('multer');
const upload = multer({ dest: 'uploads/' })

const router = express.Router();

// Rutas CRUD para las reuniones protegidas con el middleware
router.post('/', authMiddleware, createMeeting);
router.get('/', authMiddleware, getMeetings);
router.get('/:id', authMiddleware, getMeetingById);
router.put('/:id', authMiddleware, updateMeeting);
router.delete('/:id', authMiddleware, deleteMeeting);

//transcribir reunion
router.post('/:id/transcribe', authMiddleware, generateTranscription);

//traer conversacion de una reunion
router.get('/:id/conversation', getTranscriptionAsConversation);

//traer transcriptions de una reunion
router.get('/:id/transcriptions', authMiddleware, getTranscriptionsByMeeting);

//subir audio a s3
router.post('/upload-audio-s3', upload.single('audio'), uploadToS3);

module.exports = router;

const express = require('express');
const multer = require('multer');
const { transcribe,getTranscriptionBySpeakers,generateTranscription, getAllTranscriptions, getNotesByTranscription, getTranscriptionAndSummary } = require('../controllers/transcriptionController.js');


const upload = multer({ dest: 'uploads/' })

const router = express.Router();

//traer todas las transcripciones
router.get('/', getAllTranscriptions);

//transcribir audio
router.post('/transcribe', upload.single('audio'), transcribe);

//generar transcripcion
router.post('/generate-transcription', generateTranscription);

//traer notas de una transcription
router.get('/:transcriptionId/notes', getNotesByTranscription);

//traer resumen de una transcription
router.get('/:transcriptionId/summary', getTranscriptionAndSummary);

//traer participantes de una transcription
router.get('/:transcriptionId/speakers', getTranscriptionBySpeakers);
module.exports = router;

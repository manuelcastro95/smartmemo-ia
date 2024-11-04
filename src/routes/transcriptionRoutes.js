
const express = require('express');
const multer = require('multer');
const { transcribe,uploadToS3,getTranscriptionBySpeakers,getTranscriptionAsConversation } = require('../controllers/transcriptionController.js');


const upload = multer({ dest: 'uploads/' })

const router = express.Router();

router.post('/transcribe', upload.single('audio'), transcribe);

router.post('/upload', upload.single('audio'), uploadToS3);


router.get('/:transcriptionId/speakers', getTranscriptionBySpeakers);
router.get('/:transcriptionId/conversation', getTranscriptionAsConversation);
module.exports = router;

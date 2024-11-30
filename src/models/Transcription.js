const mongoose = require('mongoose');

const TranscriptionSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  transcriptUrl: {
    type: String,
    required: true
  },
  transcriptionText: {
    type: String,
    required: true
  },
  segments: [{
    _id: false,
    content: { type: String },
    speakerId: { type: String },
    startTime: { type: Number },
    endTime: { type: Number },
    type: { type: String }
  }],
  numberOfSpeakers: { 
    type: Number, 
    default: 1 
  },
  status: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Transcription', TranscriptionSchema); 
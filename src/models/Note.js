const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  content: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['transcription', 'manual'], 
    required: true 
  },
  meetingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Meeting', 
    required: true 
  },
}, { timestamps: true, versionKey: false });

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;

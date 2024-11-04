const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  scheduledTime: { 
    type: Date, 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
}, { timestamps: true,versionKey: false });

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;

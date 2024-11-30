const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  transcriptionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Transcription', 
    required: true 
  },
  meetingType: {
    type: String,
    enum: ['daily', 'planning', 'review', 'retrospective', 'general'],
    default: 'general'
  },
  summary: {
    type: Object,
    required: true,
    // La estructura variará según el tipo de reunión
    // Ejemplo para daily:
    // progress: String,
    // plans: String,
    // obstacles: String,
    // actionPoints: [String],
    // keyParticipants: [{ name: String, responsibilities: [String] }]
  },
  keywords: [{
    word: String,
    category: String
  }],
  actionItems: [{
    task: String,
    responsible: String,
    deadline: Date,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    dependencies: [String],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending'
    }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true, 
  versionKey: false 
});

// Middleware para asegurar que el summary tenga la estructura correcta según el tipo de reunión
noteSchema.pre('save', function(next) {
  if (this.isModified('summary')) {
    const summaryStructure = {
      daily: ['progress', 'plans', 'obstacles', 'actionPoints', 'keyParticipants'],
      planning: ['objectives', 'requirements', 'timeEstimates', 'risks', 'decisions', 'nextSteps'],
      review: ['achievements', 'feedback', 'issues', 'metrics', 'improvements'],
      retrospective: ['positives', 'negatives', 'lessonsLearned', 'improvements', 'commitments'],
      general: ['mainTopics', 'decisions', 'actionPoints', 'nextSteps', 'importantDates']
    };

    const requiredFields = summaryStructure[this.meetingType];
    const summaryKeys = Object.keys(this.summary);
    
    const hasAllRequired = requiredFields.every(field => summaryKeys.includes(field));
    if (!hasAllRequired) {
      next(new Error(`El resumen debe incluir todos los campos requeridos para el tipo de reunión ${this.meetingType}`));
    }
  }
  next();
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;


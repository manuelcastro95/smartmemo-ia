const Note = require('../models/Note');
const Transcription = require('../models/Transcription');

// Crear una nueva anotación
exports.createNote = async (req, res) => {
  const { resumen, transcriptionId } = req.body;

  const transcription = await Transcription.findById(transcriptionId);

  //aqui se llamara el servicio de chatgpt para generar el resumen el cual recibe el transcriptionText


  try {
    const newNote = await Note.create({ resumen, transcriptionId });
    res.status(201).json(newNote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener todas las anotaciones de una reunión
exports.getNotesByTranscription = async (req, res) => {
  const { transcriptionId } = req.params;

  try {
    const notes = await Note.find({ transcriptionId });
    res.status(200).json(notes);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener una anotación por su ID
exports.getNoteById = async (req, res) => {
  const { noteId } = req.params;
  try {
    const note = await Note.findById(noteId);
    res.status(200).json(note);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar una anotación
exports.deleteNote = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedNote = await Note.findByIdAndDelete(id);
    if (!deletedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

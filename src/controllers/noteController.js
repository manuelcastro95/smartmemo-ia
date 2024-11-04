const Note = require('../models/Note');

// Crear una nueva anotación
exports.createNote = async (req, res) => {
  const { content, type, meetingId } = req.body;

  try {
    const newNote = await Note.create({ content, type, meetingId });
    res.status(201).json(newNote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener todas las anotaciones de una reunión
exports.getNotesByMeeting = async (req, res) => {
  const { meetingId } = req.params;

  try {
    const notes = await Note.find({ meetingId });
    res.status(200).json(notes);
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

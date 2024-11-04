const Meeting = require('../models/Meeting');

// Crear una nueva reunión
exports.createMeeting = async (req, res) => {
  const { title, description, scheduledTime } = req.body;
  const userId = req.user.id; // Asume que tienes un middleware de autenticación que agrega user al req

  try {
    const newMeeting = await Meeting.create({
      title,
      description,
      scheduledTime,
      userId,
    });
    res.status(201).json(newMeeting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener todas las reuniones de un usuario
exports.getMeetings = async (req, res) => {
  const userId = req.user.id;

  try {
    const meetings = await Meeting.find({ userId });
    res.status(200).json(meetings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener una reunión específica
exports.getMeetingById = async (req, res) => {
  const { id } = req.params;

  try {
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.status(200).json(meeting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Actualizar una reunión
exports.updateMeeting = async (req, res) => {
  const { id } = req.params;
  const { title, description, scheduledTime } = req.body;

  try {
    const updatedMeeting = await Meeting.findByIdAndUpdate(
      id,
      { title, description, scheduledTime },
      { new: true }
    );
    if (!updatedMeeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.status(200).json(updatedMeeting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar una reunión
exports.deleteMeeting = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedMeeting = await Meeting.findByIdAndDelete(id);
    if (!deletedMeeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.status(200).json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const Meeting = require('../models/Meeting');
const Transcription = require('../models/Transcription');
const { uploadToS3 } = require('../services/s3Service.js');

// Crear una nueva reunión
exports.createMeeting = async (req, res) => {
  const { title, description, scheduledTime } = req.body;
  const userId = req.user.id;

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

//traer transcriptions de una reunion
exports.getTranscriptionsByMeeting = async (req, res) => {
  const { id } = req.params;
  const transcriptions = await Transcription.find({ meetingId: id });
  res.json(transcriptions);
};


exports.uploadToS3 = async (req, res) => {
  try {
    const file = req.file;
    const { meetingId } = req.body;

    // Subir archivo a S3
    const audioUrl = await uploadToS3(file);

    const meeting = await Meeting.findByIdAndUpdate(meetingId, { audioUrl }, { new: true });

    res.status(200).json({
      success: true,
      message: 'Archivo cargado correctamente',
      data: { meeting }
    });
  } catch (error) {
    console.error('Error en el controlador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el archivo',
      error: error.message
    });
  }
};

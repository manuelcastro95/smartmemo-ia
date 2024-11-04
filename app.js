const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./src/routes/authRoutes');
const meetingRoutes = require('./src/routes/meetingRoutes');
const noteRoutes = require('./src/routes/noteRoutes');
const transcriptionRoutes = require('./src/routes/transcriptionRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection


mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('Conexión exitosa a la base de datos');
}).catch((error) => {
  console.error('Error conectando a la base de datos:', error);
});


// Routes
app.get('/', (req, res) => {
  res.send('SmartMemo AI API is running...');
});


app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/transcription', transcriptionRoutes);


// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

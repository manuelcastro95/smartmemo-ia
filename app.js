const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./src/routes/authRoutes');
const meetingRoutes = require('./src/routes/meetingRoutes');
const noteRoutes = require('./src/routes/noteRoutes');
const transcriptionRoutes = require('./src/routes/transcriptionRoutes');

const http = require('http');
const WebSocket = require('ws');
const transcriptionStreamingService = require('./src/services/streamingTranscriptionService');


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
 
// Configuración de WebSocket
wss.on('connection', (ws) => {
  console.log("Nuevo cliente conectado al WebSocket");

  // Inicia el servicio de transcripción para este WebSocket
  transcriptionStreamingService.iniciarSesionStreaming(ws);

  // Recibe los chunks de audio del cliente y los envía al servicio de transcripción
  ws.on('message', (data) => {
    transcriptionStreamingService.procesarChunkAudio(ws, data);
  });

  // Finaliza la transcripción cuando el cliente cierra la conexión
  ws.on('close', () => {
    transcriptionStreamingService.finalizarStream(ws);
    console.log("Cliente desconectado del WebSocket");
  });

  ws.on('error', (error) => {
    console.error("WebSocket error:", error);
  });
});

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
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

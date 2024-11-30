const transcriptionStreamingService = require('../services/transcriptionStreamingService');

class webSocketController {
  constructor() {
    this.streamsActivos = new Map();
    this.limiteStreams = 25; // Limite de streams
  }

  async manejarConexion(ws) {
    console.log('Nueva conexión WebSocket establecida');

    // Verificar el límite de streams activos
    if (this.streamsActivos.size >= this.limiteStreams) {
      ws.send(JSON.stringify({
        tipo: 'error',
        mensaje: 'Límite de conexiones alcanzado. Intente nuevamente más tarde.'
      }));
      ws.close();
      return;
    }

    ws.on('message', async (mensaje) => {
      try {
        // Verificar si el mensaje es binario o texto
        if (mensaje instanceof Buffer) {
          // Procesar directamente el chunk de audio binario
          if (this.streamsActivos.has(ws)) {
            transcriptionStreamingService.procesarChunkAudio(ws, mensaje);
          }
          return;
        }

        // Si no es binario, intentar parsearlo como JSON
        const datos = JSON.parse(mensaje);

        if (datos.tipo === 'audio_data' && !this.streamsActivos.has(ws)) {
          try {
            const streamAudio = await transcriptionStreamingService.iniciarSesionStreaming(ws);
            this.streamsActivos.set(ws, streamAudio);
          } catch (error) {
            console.error('Error al iniciar sesión de streaming:', error);
            ws.send(JSON.stringify({
              tipo: 'error',
              mensaje: 'Error al iniciar sesión de streaming. Intente nuevamente más tarde.'
            }));
            return;
          }
        } else if (datos.tipo === 'finalizar_stream') {
          transcriptionStreamingService.finalizarStream(ws);
          this.streamsActivos.delete(ws);
        }
      } catch (error) {
        console.error('Error procesando mensaje WebSocket:', error);
        ws.send(JSON.stringify({
          tipo: 'error',
          mensaje: 'Error procesando el mensaje'
        }));
      }
    });

    ws.on('close', () => {
      this.cerrarStream(ws);
    });

    ws.on('error', (error) => {
      console.error('Error en WebSocket:', error);
      this.cerrarStream(ws);
    });
  }

  cerrarStream(ws) {
    if (this.streamsActivos.has(ws)) {
      transcriptionStreamingService.finalizarStream(ws);
      this.streamsActivos.delete(ws);
    }
  }
}

module.exports = new webSocketController();


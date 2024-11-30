const http2 = require('http2');
const { SignatureV4 } = require('@aws-sdk/signature-v4');
const { Sha256 } = require("@aws-crypto/sha256-browser");
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { PassThrough } = require('stream');

class TranscriptionStreamingService {
  constructor() {
    this.streams = new Map();
  }

  async iniciarSesionStreaming(ws) {
    const audioStream = new PassThrough();
    this.streams.set(ws, audioStream);

    const region = process.env.AWS_REGION;
    const endpoint = `https://transcribestreaming.${region}.amazonaws.com:8443`;

    const signer = new SignatureV4({
      credentials: defaultProvider(),
      region: region,
      service: 'transcribe',
      sha256: Sha256,
    });

    const request = await signer.sign({
      method: 'POST',
      protocol: 'https:',
      hostname: `transcribestreaming.${region}.amazonaws.com`,
      path: '/stream-transcription',
      headers: {
        'content-type': 'application/vnd.amazon.eventstream',
        'x-amzn-transcribe-language-code': 'es-ES',
        'x-amzn-transcribe-sample-rate': '16000',
        'x-amzn-transcribe-media-encoding': 'pcm',
      },
    });

    const client = http2.connect(endpoint);
    const req = client.request(request.headers);

    req.on('response', (headers) => {
      console.log('Headers:', headers);
    });

    req.on('data', (chunk) => {
      const eventString = chunk.toString();
      console.log('Evento recibido de AWS:', eventString);
      try {
        const event = JSON.parse(eventString);
        if (event.TranscriptEvent) {
          const results = event.TranscriptEvent.Transcript.Results;
          if (results && results.length > 0) {
            const transcripcion = results[0].Alternatives[0].Transcript;
            console.log('Transcripción generada:', transcripcion);
            ws.send(JSON.stringify({
              tipo: 'transcripcion',
              texto: transcripcion,
            }));
          }
        }
      } catch (error) {
        console.error('Error procesando el evento de transcripción:', error);
      }
    });

    req.on('end', () => {
      console.log('Transcripción finalizada');
      client.close();
    });

    audioStream.pipe(req);

    req.on('error', (error) => {
      console.error('Error en el flujo de transcripción HTTP/2:', error);
      ws.send(JSON.stringify({
        tipo: 'error',
        mensaje: 'Error en la transcripción en tiempo real',
      }));
    });
  }

  procesarChunkAudio(ws, chunk) {
    const stream = this.streams.get(ws);
    if (stream) {
      try {
        console.log("Recibiendo chunk de audio:", chunk);
        stream.write(chunk);
      } catch (error) {
        console.error('Error al escribir en el flujo de audio:', error);
      }
    } else {
      console.log("No se encontró el stream para el WebSocket.");
    }
  }

  finalizarStream(ws) {
    const stream = this.streams.get(ws);
    if (stream) {
      try {
        stream.end();
      } catch (error) {
        console.error('Error al finalizar el flujo de audio:', error);
      } finally {
        this.streams.delete(ws);
      }
    }
  }
}

module.exports = new TranscriptionStreamingService();

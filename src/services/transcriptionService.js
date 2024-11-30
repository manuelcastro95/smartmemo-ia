const { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const Transcription = require('../models/Transcription');

// Este servicio maneja la transcripción de audio usando AWS Transcribe
// La función principal transcribeAudio recibe una URL de audio y un ID de usuario
const transcribeAudio = async (audioUrl, userId, meetingId) => {

  // Inicializa el cliente de AWS Transcribe
  const transcribe = new TranscribeClient({ region: process.env.AWS_REGION });
  const jobName = `transcription-job-${Date.now()}`; // Crea un nombre único para el trabajo

  // Configura los parámetros para el trabajo de transcripción
  const params = {
    TranscriptionJobName: jobName,
    LanguageCode: 'es-ES', // Configura el idioma a español
    Media: { MediaFileUri: audioUrl }, // URL del archivo de audio a transcribir
    OutputBucketName: process.env.AWS_BUCKET_NAME, // Bucket donde se guardará la transcripción
    Settings: {
      ShowSpeakerLabels: true,
      MaxSpeakerLabels: 10  // Puedes ajustar este número según tus necesidades
    }
  };

  try {
    // Inicia el trabajo de transcripción
    const command = new StartTranscriptionJobCommand(params);
    await transcribe.send(command);
    console.log(`Trabajo de transcripción iniciado: ${jobName}`);
    const transcriptUri = await checkTranscriptionStatus(transcribe, jobName);

    // Espera 2 segundos para asegurar que el archivo esté disponible en S3
    await new Promise(resolve => setTimeout(resolve, 2000));

    return await saveTranscription(transcriptUri, audioUrl, userId, meetingId);
  } catch (error) {
    console.error(`Error al iniciar el trabajo de transcripción: ${error.message}`);
    throw new Error('Error en la transcripción con AWS Transcribe');
  }
};

// Función para guardar la transcripción en MongoDB
const saveTranscription = async (transcriptUri, audioUrl, userId, meetingId) => {
  try {
    // Procesa la URI para obtener la ruta correcta del archivo en S3
    const url = new URL(transcriptUri);
    const key = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));
    console.log('Intentando acceder al archivo con key:', key);

    // Configura el cliente S3 y obtiene el archivo de transcripción
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    });

    const response = await s3Client.send(command);

    // Convierte el stream de datos a texto y lo parsea como JSON
    const transcriptionText = await streamToString(response.Body);
    const transcriptionData = JSON.parse(transcriptionText);

    // Extraemos la información de los hablantes y segmentos
    const segments = transcriptionData.results.speaker_labels?.segments || [];
    const items = transcriptionData.results.items || [];

    // Aseguramos que los datos estén en el formato correcto
    const processedTranscript = items.map(item => ({
      content: item.alternatives[0].content || '',
      speakerId: segments.find(seg =>
        parseFloat(item.start_time) >= parseFloat(seg.start_time) &&
        parseFloat(item.end_time) <= parseFloat(seg.end_time)
      )?.speaker_label || 'unknown',
      startTime: parseFloat(item.start_time || 0),
      endTime: parseFloat(item.end_time || 0),
      type: item.type || 'pronunciation'
    }));

    // Verificamos que los datos sean válidos antes de guardar
    console.log('Primer segmento de ejemplo:', processedTranscript[0]);

    // Creamos un nuevo registro en MongoDB con la transcripción
    const transcription = new Transcription({
      meetingId: meetingId,
      userId,
      audioUrl,
      transcriptUrl: transcriptUri,
      transcriptionText: transcriptionData.results.transcripts[0].transcript,
      segments: processedTranscript,
      numberOfSpeakers: transcriptionData.results.speaker_labels?.speakers || 1,
      status: 'completed',
      createdAt: new Date()
    });

    await transcription.save();
    console.log('Transcripción guardada en MongoDB con información de hablantes');

    return {
      transcriptionId: transcription._id,
      text: transcriptionData.results.transcripts[0].transcript,
      segments: processedTranscript,
      numberOfSpeakers: transcriptionData.results.speaker_labels?.speakers || 1
    };
  } catch (error) {
    console.error('Error al guardar la transcripción:', error);
    // Log del error
    if (error.errors) {
      console.error('Detalles de validación:', JSON.stringify(error.errors, null, 2));
    }
    throw new Error('Error al guardar la transcripción en la base de datos');
  }
};

// Función auxiliar para convertir un stream de datos a string
const streamToString = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
  });
};

// Función para verificar el estado del trabajo de transcripción
const checkTranscriptionStatus = async (transcribe, jobName) => {
  return new Promise((resolve, reject) => {
    // Verifica el estado cada 5 segundos
    const interval = setInterval(async () => {
      try {
        const command = new GetTranscriptionJobCommand({ TranscriptionJobName: jobName });
        const status = await transcribe.send(command);
        const jobStatus = status.TranscriptionJob.TranscriptionJobStatus;

        console.log(`Estado actual del trabajo: ${jobStatus}`);

        if (jobStatus === 'COMPLETED') {
          // Si la transcripción está completa, obtiene la URI del archivo
          clearInterval(interval);
          const uri = status.TranscriptionJob.Transcript.TranscriptFileUri;
          console.log('Transcripción completada. URI:', uri);
          resolve(uri);
        } else if (jobStatus === 'FAILED') {
          // Si la transcripción falló, rechaza la promesa
          clearInterval(interval);
          console.error('Detalles del error:', status.TranscriptionJob.FailureReason);
          reject(new Error('El trabajo de transcripción falló.'));
        } else {
          console.log('Esperando a que se complete la transcripción...');
        }
      } catch (err) {
        clearInterval(interval);
        console.error(`Error al comprobar el estado: ${err.message}`);
        reject(new Error('Error en la transcripción con AWS Transcribe'));
      }
    }, 5000);
  });
};

module.exports = { transcribeAudio };

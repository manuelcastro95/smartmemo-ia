const { transcribeAudio } = require('../services/transcriptionService');
const { uploadToS3, deleteFromS3 } = require('../services/s3Service.js');
const Transcription = require('../models/Transcription');

exports.transcribe = async (req, res) => {
    try {
        const audioBuffer = req.file.buffer;
        const transcript = await transcribeAudioStream(audioBuffer);
        res.json({ transcript });
      } catch (error) {
        console.error('Error transcribiendo el audio:', error);
        res.status(500).json({ error: 'Error en la transcripción' });
      }
};

exports.uploadToS3 = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.userId;
       
        // Subir archivo a S3
        const audioUrl = await uploadToS3(file);
        
        // Iniciar transcripción y guardar en MongoDB
        const transcriptionResult = await transcribeAudio(audioUrl, userId);

        res.status(200).json({
            success: true,
            message: 'Archivo procesado correctamente',
            data: {
                audioUrl,
                transcriptionId: transcriptionResult.transcriptionId,
                transcriptionText: transcriptionResult.text
            }
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

exports.getTranscriptionBySpeakers = async (req, res) => {
    try {
        const { transcriptionId } = req.params;
        
        const transcription = await Transcription.findById(transcriptionId);
        if (!transcription) {
            return res.status(404).json({ message: 'Transcripción no encontrada' });
        }

        // Agrupar por hablante
        const speakerInterventions = transcription.segments.reduce((acc, segment) => {
            if (!acc[segment.speakerId]) {
                acc[segment.speakerId] = [];
            }
            
            acc[segment.speakerId].push({
                content: segment.content,
                startTime: segment.startTime,
                endTime: segment.endTime,
                type: segment.type
            });
            
            return acc;
        }, {});

        // Formatear la respuesta
        const formattedResponse = {
            meetingId: transcription.meetingId,
            numberOfSpeakers: transcription.numberOfSpeakers,
            speakers: Object.keys(speakerInterventions).map(speakerId => ({
                speakerId,
                interventions: speakerInterventions[speakerId]
            })),
            createdAt: transcription.createdAt
        };

        res.json(formattedResponse);
        
    } catch (error) {
        console.error('Error al obtener transcripción:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.getTranscriptionAsConversation = async (req, res) => {
    try {
        const { transcriptionId } = req.params;
        
        const transcription = await Transcription.findById(transcriptionId);
        if (!transcription) {
            return res.status(404).json({ message: 'Transcripción no encontrada' });
        }

        // Filtrar y ordenar segmentos válidos
        const sortedSegments = transcription.segments
            .filter(segment => segment.speakerId) // Filtrar segmentos sin speakerId
            .sort((a, b) => a.startTime - b.startTime);
        
        // Agrupar en párrafos
        const paragraphs = [];
        let currentParagraph = {
            speakerId: null,
            content: [],
            timestamp: { start: null, end: null }
        };

        sortedSegments.forEach((segment, index) => {
            const TIME_THRESHOLD = 4;
            const prevSegment = sortedSegments[index - 1];
            
            const shouldStartNewParagraph = 
                currentParagraph.speakerId !== segment.speakerId || 
                (prevSegment && (segment.startTime - prevSegment.endTime) > TIME_THRESHOLD);

            if (shouldStartNewParagraph && currentParagraph.content.length > 0) {
                // Guardar párrafo actual
                currentParagraph.timestamp.end = prevSegment.endTime;
                paragraphs.push({ ...currentParagraph });
                
                // Iniciar nuevo párrafo
                currentParagraph = {
                    speakerId: segment.speakerId,
                    content: [segment.content],
                    timestamp: { start: segment.startTime, end: null }
                };
            } else {
                // Continuar párrafo actual
                if (currentParagraph.content.length === 0) {
                    currentParagraph.speakerId = segment.speakerId;
                    currentParagraph.timestamp.start = segment.startTime;
                }
                currentParagraph.content.push(segment.content);
            }
        });

        // Añadir el último párrafo
        if (currentParagraph.content.length > 0) {
            currentParagraph.timestamp.end = sortedSegments[sortedSegments.length - 1].endTime;
            paragraphs.push(currentParagraph);
        }

        // Formatear párrafos
        const conversationFlow = paragraphs.map(paragraph => ({
            speakerId: paragraph.speakerId,
            content: paragraph.content.join(' '), // Unir las frases en un párrafo
            timestamp: paragraph.timestamp
        }));

        const formattedResponse = {
            meetingId: transcription.meetingId,
            numberOfSpeakers: transcription.numberOfSpeakers,
            duration: transcription.duration,
            conversation: conversationFlow,
            createdAt: transcription.createdAt
        };

        res.json(formattedResponse);
        
    } catch (error) {
        console.error('Error al obtener transcripción:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};


const { transcribeAudio } = require('../services/transcriptionService');
const { uploadToS3, deleteFromS3 } = require('../services/s3Service.js');
const Transcription = require('../models/Transcription');
const Note = require('../models/Note.js');
const { generateSummary } = require('../services/summaryService');
const Meeting = require('../models/Meeting.js');
const chatGPTService = require('../services/chatGPTService');

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
        const { id } = req.params;

        const transcription = await Transcription.findOne({meetingId: id});

       
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
            id: transcription._id,
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

exports.generateTranscription = async (req, res) => {
    try {
        const userId = req.userId;
        const meetingId = req.params.id;

        const meeting  = await Meeting.findById(meetingId);

        // Subir archivo a S3
        const audioUrl = meeting.audioUrl;
        
        // Iniciar transcripción y guardar en MongoDB
        const transcriptionResult = await transcribeAudio(audioUrl, userId, meetingId);

        // Obtener la transcripción completa
        const transcription = await Transcription.findById(transcriptionResult.transcriptionId);
        if (!transcription) {
            return res.status(404).json({ message: 'Transcripción no encontrada' });
        }

        // Filtrar y ordenar segmentos válidos
        const sortedSegments = transcription.segments
            .filter(segment => segment.speakerId)
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
                currentParagraph.timestamp.end = prevSegment.endTime;
                paragraphs.push({ ...currentParagraph });
                
                currentParagraph = {
                    speakerId: segment.speakerId,
                    content: [segment.content],
                    timestamp: { start: segment.startTime, end: null }
                };
            } else {
                if (currentParagraph.content.length === 0) {
                    currentParagraph.speakerId = segment.speakerId;
                    currentParagraph.timestamp.start = segment.startTime;
                }
                currentParagraph.content.push(segment.content);
            }
        });

        if (currentParagraph.content.length > 0) {
            currentParagraph.timestamp.end = sortedSegments[sortedSegments.length - 1].endTime;
            paragraphs.push(currentParagraph);
        }

        const conversationFlow = paragraphs.map(paragraph => ({
            speakerId: paragraph.speakerId,
            content: paragraph.content.join(' '),
            timestamp: paragraph.timestamp
        }));

        res.status(200).json({
            success: true,
            message: 'Archivo procesado correctamente',
            data: {
                audioUrl,
                transcriptionId: transcriptionResult.transcriptionId,
                meetingId: transcription.meetingId,
                numberOfSpeakers: transcription.numberOfSpeakers,
                duration: transcription.duration,
                conversation: conversationFlow,
                createdAt: transcription.createdAt
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


exports.getAllTranscriptions = async (req, res) => {
    const transcriptions = await Transcription.find();
    res.json(transcriptions);
};

exports.getNotesByTranscription = async (req, res) => {
    const { transcriptionId } = req.params;
    const notes = await Note.find({ transcriptionId });
    res.json(notes);
};

// Función para obtener una transcripción y generar un resumen
exports.getTranscriptionAndSummary = async (req, res) => {
    const { transcriptionId } = req.params;
    const { meetingType = 'general' } = req.query;

    try {
        const transcription = await Transcription.findById(transcriptionId);
        if (!transcription) {
            return res.status(404).json({ message: 'Transcripción no encontrada' });
        }

        // Generar resumen y elementos adicionales
        const [summaryResponse, keywordsResponse, actionItemsResponse] = await Promise.all([
            chatGPTService.generateSummary(transcription.transcriptionText, meetingType),
            chatGPTService.generateKeywords(transcription.transcriptionText),
            chatGPTService.generateActionItems(transcription.transcriptionText)
        ]);

        // Procesar las respuestas para ajustarlas al esquema
        const summary = JSON.parse(summaryResponse); // Asumiendo que ChatGPT devuelve JSON válido
        const keywords = JSON.parse(keywordsResponse).map(k => ({
            word: k.keyword,
            category: k.category
        }));
        const actionItems = JSON.parse(actionItemsResponse).map(item => ({
            task: item.task,
            responsible: item.responsible || null,
            deadline: item.deadline ? new Date(item.deadline) : null,
            priority: item.priority?.toLowerCase() || 'medium',
            dependencies: item.dependencies || [],
            status: 'pending'
        }));

        // Crear una nueva nota con la estructura actualizada
        const note = await Note.create({
            transcriptionId,
            meetingType,
            summary,
            keywords,
            actionItems
        });

        res.status(200).json({
            success: true,
            data: {
                transcription: {
                    meetingId: transcription.meetingId,
                    id: transcription._id,
                    audioUrl: transcription.audioUrl,
                    transcriptionText: transcription.transcriptionText,
                },
                note: {
                    id: note._id,
                    summary,
                    keywords,
                    actionItems,
                    meetingType
                }
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            message: 'Error interno del servidor',
            error: error.message 
        });
    }
};


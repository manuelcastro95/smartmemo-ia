const OpenAI = require('openai');

class ChatGPTService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateSummary(transcriptionText, meetingType) {
    try {
      const prompt = this.getPromptByMeetingType(meetingType, transcriptionText);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error al generar el resumen con ChatGPT:', error);
      throw new Error('Error al generar el resumen con ChatGPT');
    }
  }

  getPromptByMeetingType(meetingType, transcriptionText) {
    const prompts = {
      'daily': `
        Analiza la siguiente transcripción de una reunión daily scrum:
        "${transcriptionText}"
        
        Por favor, proporciona un resumen estructurado en formato JSON que incluya:
        {
          "progress": "¿Qué se completó desde la última reunión?",
          "plans": "¿Qué se planea hacer hoy?",
          "obstacles": "¿Qué impedimentos se mencionaron?",
          "actionPoints": ["Lista de tareas específicas mencionadas"],
          "keyParticipants": [{"name": "nombre", "responsibilities": ["responsabilidades"]}]
        }
      `,

      'planning': `
        Analiza la siguiente transcripción de una reunión de planificación:
        "${transcriptionText}"
        
        Por favor, proporciona un resumen estructurado en formato JSON que incluya:
        {
          "objectives": ["Objetivos principales discutidos"],
          "requirements": ["Requisitos y especificaciones definidos"],
          "timeEstimates": ["Estimaciones de tiempo/esfuerzo"],
          "risks": ["Riesgos identificados"],
          "decisions": ["Decisiones tomadas"],
          "nextSteps": ["Próximos pasos y responsables"]
        }
      `,

      'review': `
        Analiza la siguiente transcripción de una reunión de revisión:
        "${transcriptionText}"
        
        Por favor, proporciona un resumen estructurado en formato JSON que incluya:
        {
          "achievements": ["Logros y entregables presentados"],
          "feedback": ["Feedback recibido"],
          "issues": ["Problemas o preocupaciones identificadas"],
          "metrics": ["Métricas o KPIs discutidos"],
          "improvements": ["Acciones de mejora propuestas"]
        }
      `,

      'retrospective': `
        Analiza la siguiente transcripción de una reunión de retrospectiva:
        "${transcriptionText}"
        
        Por favor, proporciona un resumen estructurado en formato JSON que incluya:
        {
          "positives": ["Lo que funcionó bien"],
          "negatives": ["Lo que no funcionó bien"],
          "lessonsLearned": ["Lecciones aprendidas"],
          "improvements": ["Acciones de mejora propuestas"],
          "commitments": ["Compromisos del equipo"]
        }
      `,

      'general': `
        Analiza la siguiente transcripción de reunión:
        "${transcriptionText}"
        
        Por favor, proporciona un resumen estructurado en formato JSON que incluya:
        {
          "mainTopics": ["Temas principales discutidos"],
          "decisions": ["Decisiones importantes tomadas"],
          "actionPoints": ["Puntos de acción y responsables"],
          "nextSteps": ["Próximos pasos"],
          "importantDates": ["Fechas o plazos importantes mencionados"]
        }
      `
    };

    return prompts[meetingType] || prompts.general;
  }

  async generateKeywords(transcriptionText) {
    try {
      const prompt = `
        Analiza la siguiente transcripción y extrae las palabras clave más relevantes:
        "${transcriptionText}"
        
        Por favor, proporciona un JSON con el siguiente formato:
        [
          {
            "keyword": "palabra o frase corta",
            "category": "categoría (técnico/negocio/proceso)"
          }
        ]
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 500
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error al generar palabras clave con ChatGPT:', error);
      throw new Error('Error al generar palabras clave con ChatGPT');
    }
  }

  async generateActionItems(transcriptionText) {
    try {
      const prompt = `
        Analiza la siguiente transcripción y extrae los elementos de acción:
        "${transcriptionText}"
        
        Por favor, proporciona un JSON con el siguiente formato:
        [
          {
            "task": "descripción de la tarea",
            "responsible": "nombre del responsable (si se menciona)",
            "deadline": "fecha límite en formato YYYY-MM-DD (si se menciona)",
            "priority": "HIGH/MEDIUM/LOW (basada en el contexto)",
            "dependencies": ["lista de dependencias (si se mencionan)"]
          }
        ]
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 1000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error al generar elementos de acción con ChatGPT:', error);
      throw new Error('Error al generar elementos de acción con ChatGPT');
    }
  }
}

module.exports = new ChatGPTService(); 
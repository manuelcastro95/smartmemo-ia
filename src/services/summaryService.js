// const { pipeline } = require('@huggingface/transformers');

// // Usar un modelo más ligero y compatible con JavaScript
// const summarizer = pipeline('summarization', 'sshleifer/distilbart-cnn-12-6');

// const generateSummary = async (text) => {
//     try {
//         const summary = await summarizer(text, {
//             max_length: 130,
//             min_length: 30,
//             do_sample: false
//         });
//         return summary[0].summary_text;
//     } catch (error) {
//         console.error('Error al generar el resumen:', error);
//         throw new Error('Error al generar el resumen');
//     }
// };

// module.exports = { generateSummary }; 
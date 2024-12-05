const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const { Readable } = require('stream');

// Configurar S3
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Función auxiliar para formatear el nombre del archivo
const formatFileName = (fileName) => {
    return fileName
        .normalize('NFD')                     // Descomponer caracteres especiales
        .replace(/[\u0300-\u036f]/g, '')     // Eliminar diacríticos
        .replace(/[^a-zA-Z0-9.]/g, '-')      // Reemplazar caracteres especiales y espacios con guion
        .replace(/-+/g, '-')                 // Evitar guiones múltiples consecutivos
        .toLowerCase();                      // Convertir a minúsculas
};

// Función para subir a S3
const uploadToS3 = async (file) => {
    const formattedFileName = formatFileName(file.originalname);
    
    const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: formattedFileName,
        Body: file.buffer,
        ContentType: file.mimetype
    };

    try {
        const data = await s3Client.send(new PutObjectCommand(uploadParams));
        const fileUrl = `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
        console.log("se termino de subir el archivo", fileUrl);
        return fileUrl;
    } catch (err) {
        console.log("Error", err);
        throw err;
    }
};

module.exports = { uploadToS3 }; 
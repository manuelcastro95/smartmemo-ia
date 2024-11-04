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

// Función para subir a S3
const uploadToS3 = async (file) => {
    const fileStream = fs.createReadStream(file.path);
    const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.originalname,
        Body: fileStream,
        ContentType: file.mimetype
    };

    try {
        const data = await s3Client.send(new PutObjectCommand(uploadParams));
        
        // Construir la URL del archivo subido
        const fileUrl = `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
        console.log("se termino de subir el archivo", fileUrl);
        return fileUrl;
    } catch (err) {
        console.log("Error", err);
        throw err;
    }
};

module.exports = { uploadToS3 }; 
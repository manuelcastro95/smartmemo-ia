
# 🎙️ SmartMemo AI

SmartMemo AI es una aplicación innovadora que transforma tus reuniones en conocimiento accionable. Utilizando tecnologías de vanguardia en transcripción de voz y procesamiento de lenguaje natural, convierte automáticamente el audio de tus reuniones en resúmenes estructurados, puntos de acción y análisis detallados.

## ✨ Características Principales

### 🎯 Transcripción Inteligente
- Transcripción en tiempo real de audio a texto
- Identificación automática de hablantes
- Soporte para múltiples idiomas

### 🤖 Análisis con IA
- Generación automática de resúmenes
- Extracción de puntos clave y decisiones
- Identificación de tareas y responsables
- Categorización inteligente de temas

### 📊 Tipos de Reuniones Especializados
- Daily Scrum
- Planificación
- Revisión
- Retrospectiva
- Reuniones generales

### 🔄 Integración y Almacenamiento
- Almacenamiento seguro en AWS S3
- Comunicación en tiempo real vía WebSocket
- API RESTful para fácil integración

## 🚀 Tecnologías Utilizadas

- **Backend**: Node.js, Express
- **Base de Datos**: MongoDB
- **IA y ML**: OpenAI GPT-4
- **Servicios Cloud**: AWS (S3, Transcribe)
- **Tiempo Real**: WebSocket
- **Autenticación**: JWT

## 📋 Requisitos Previos


Node.js >= 14.0.0
MongoDB >= 4.0.0
npm >= 6.0.0


## 🛠️ Instalación

1. **Clonar el repositorio**

git clone https://github.com/manuelcastro95/smartmemo-ai.git
cd smartmemo-ai


2. **Instalar dependencias**

npm install


3. **Configurar variables de entorno**

cp .env.example .env
# Editar .env con tus credenciales


4. **Iniciar la aplicación**

npm run dev     # Entorno de desarrollo
npm start       # Entorno de producción


## 🔑 Variables de Entorno


# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/smartmemo

# AWS
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=tu_region
AWS_BUCKET_NAME=tu_bucket

# OpenAI
OPENAI_API_KEY=tu_api_key

# JWT
JWT_SECRET=tu_jwt_secret


## 📚 API Endpoints

### Autenticación
- \`POST /api/auth/register\` - Registro de usuario
- \`POST /api/auth/login\` - Inicio de sesión
- \`POST /api/auth/logout\` - Cierre de sesión

### Reuniones
- \`POST /api/meetings\` - Crear nueva reunión
- \`GET /api/meetings\` - Listar reuniones
- \`GET /api/meetings/:id\` - Obtener reunión específica
- \`PUT /api/meetings/:id\` - Actualizar reunión
- \`DELETE /api/meetings/:id\` - Eliminar reunión

### Transcripciones
- \`POST /api/meetings/:id/transcribe\` - Transcribir audio de reunión
- \`GET /api/meetings/:id/conversation\` - Obtener conversación transcrita
- \`GET /api/transcriptions/:id/summary\` - Obtener resumen y análisis

### Notas
- \`GET /api/notes/:transcriptionId\` - Obtener notas de transcripción
- \`POST /api/notes\` - Crear nueva nota
- \`DELETE /api/notes/:id\` - Eliminar nota

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Fork el repositorio
2. Crea una rama para tu feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit tus cambios (\`git commit -m 'Add: Amazing Feature'\`)
4. Push a la rama (\`git push origin feature/AmazingFeature\`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## 👥 Autores

- **Manuel Castro**  - [manuelcastro95](https://github.com/manuelcastro95)

## 🙏 Agradecimientos

- OpenAI por su API GPT-4
- AWS por sus servicios de transcripción y almacenamiento
- La comunidad de código abierto

---
⌨️ con ❤️ por [Manuel Castro](https://github.com/manuelcastro95)

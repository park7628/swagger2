const express = require('express');
const SwaggerParser = require('@apidevtools/swagger-parser');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const wav = require('wav');
const db = require('./db/db_utils');
const authRoutes = require('./routes/authRoutes');
const configRoutes = require('./routes/configRoutes');
const port = 3000;

const swaggerDocument = YAML.load(path.join(__dirname, 'openapi/openapi.yml'));

SwaggerParser.bundle(swaggerDocument, {
    resolve: {
        file: {
            basePath: path.join(__dirname, 'openapi') 
        }
    }
}).then((bundledSpec) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(bundledSpec));
});

app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

app.get('/api/hello', (req, res) => {
    res.json({success: true});
});

app.use('/api/auth', authRoutes);

app.use('/api/config', configRoutes);

app.use(bodyParser.raw({type: 'application/octet-stream', limit: '10mb'}));

app.post('/api/uploadAudio', (req, res) => {
    const audioData = req.body;

    const writer = new wav.FileWriter('/statics/recorded_audio.wav', {
        channels: 1,
        sampleRate: 16000,
        bitDepth: 16
    });

    writer.write(audioData);
    writer.end();

    console.log('Audio data received and saved as WAV file');
    res.sendStatus(200);
});

async function startServer() {
    try {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await db.createTable();
        app.listen(port, () => {
            console.log("서버가 실행 중입니다.");
        });
    } catch(error) {
        console.error("서버 시작 중 오류 발생:", error);
    }
}

startServer();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { getQRCode, getClientStatus } = require('./whatsappClient');
const { getSheetInfo, getSheetStatus } = require('./googleSheets');
const { getAppStatus } = require('./appStatus');
const { getLogs } = require('./logger');
const { getLLMStatus } = require('./llmHandler');

const app = express();
let port = process.env.PORT || 3001;

// Configura Express para servir archivos estáticos
app.use(express.static('public'));

function startWebServer() {
    const server = http.createServer(app);
    const io = socketIo(server);

    // Manejo de conexiones de Socket.IO
    io.on('connection', (socket) => {
        console.log('Nuevo cliente conectado');

        socket.on('disconnect', () => {
            console.log('Cliente desconectado');
        });
    });

    // Modificar la función addLog para emitir los logs a través de Socket.IO
    const { addLog } = require('./logger');
    const emitLog = (message) => {
        addLog(message);
        io.emit('newLog', { time: new Date().toLocaleString(), message });
    };

    app.get('/', (req, res) => {
        console.log('Solicitud recibida para la página principal');
        let appStatus;
        try {
            appStatus = getAppStatus();
            console.log('Estado de la aplicación:', appStatus);
        } catch (error) {
            console.error('Error al obtener el estado de la aplicación:', error);
            appStatus = {
                whatsappStatus: 'Error',
                googleSheetsStatus: 'Error',
                webServerStatus: 'Activo',
                lastUpdate: new Date().toLocaleString(),
                appVersion: 'Error',
                environment: process.env.NODE_ENV || 'development'
            };
        }

        const sheetInfo = getSheetInfo();
        console.log('Información de la hoja de cálculo:', sheetInfo.title);

        const activityLogs = getLogs();

        const llmStatus = getLLMStatus(); // Obtener el estado del LLM

        res.send(`
            <html>
                <head>
                    <title>SOC - Software de Onboarding y Clasificación</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            line-height: 1.6; 
                            padding: 20px; 
                            margin: 0;
                            background-color: #f0f0f0;
                        }
                        .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 20px;
                            background-color: #ffffff;
                            padding: 10px;
                            border-radius: 5px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        .logo { 
                            max-width: 200px; 
                        }
                        .title {
                            text-align: right;
                        }
                        h1 { 
                            color: #333; 
                            margin: 0;
                        }
                        h2 {
                            color: #444;
                            margin-top: 20px;
                        }
                        .content {
                            display: flex;
                            justify-content: space-between;
                            gap: 20px;
                        }
                        .column {
                            flex: 1;
                            background-color: #ffffff;
                            padding: 20px;
                            border-radius: 5px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        .qr-code {
                            width: 150px;
                            height: 150px;
                            margin: 0 auto;
                            display: block;
                        }
                        .status-section {
                            margin-top: 20px;
                            padding: 15px;
                            background-color: #e7f3fe;
                            border-left: 5px solid #2196F3;
                            border-radius: 3px;
                        }
                        .status-item {
                            margin-bottom: 10px;
                        }
                        .sheet-info {
                            background-color: #e8f5e9;
                            border-left: 5px solid #4caf50;
                            padding: 15px;
                            border-radius: 3px;
                            margin-top: 20px;
                        }
                        .sheet-item {
                            margin-bottom: 10px;
                        }
                        .logs {
                            margin-top: 20px;
                            padding: 10px;
                            background-color: #f0f0f0;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                        }
                        .log-entry {
                            margin-bottom: 5px;
                        }
                        .llm-info {
                            background-color: #fff3e0;
                            border-left: 5px solid #ff9800;
                            padding: 15px;
                            border-radius: 3px;
                            margin-top: 20px;
                        }
                        .llm-item {
                            margin-bottom: 10px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <img src="/images/saia-logo.png" alt="Logo de SAIA" class="logo">
                        <div class="title">
                            <h1>SOC - Software de Onboarding y Clasificación</h1>
                        </div>
                    </div>
                    <div class="content">
                        <div class="column">
                            <h2>Estado de la Aplicación</h2>
                            <div class="status-section">
                                <div class="status-item"><strong>Estado de WhatsApp:</strong> ${appStatus.whatsappStatus || 'No disponible'}</div>
                                <div class="status-item"><strong>Estado de Google Sheets:</strong> ${appStatus.googleSheetsStatus || 'No disponible'}</div>
                                <div class="status-item"><strong>Estado del Servidor Web:</strong> ${appStatus.webServerStatus || 'Activo'}</div>
                                <div class="status-item"><strong>Última actualización:</strong> ${appStatus.lastUpdate || new Date().toLocaleString()}</div>
                                <div class="status-item"><strong>Versión de la aplicación:</strong> ${appStatus.appVersion || 'No disponible'}</div>
                                <div class="status-item"><strong>Ambiente:</strong> ${appStatus.environment || process.env.NODE_ENV || 'development'}</div>
                            </div>
                            <h2>Escanear el QR para conectar WhatsApp</h2>
                            ${getQRCode() ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getQRCode())}" class="qr-code">` : 'Esperando código QR...'}
                        </div>
                        <div class="column">
                            <h2>Información de la Hoja de Cálculo</h2>
                            <div class="sheet-info">
                                <div class="sheet-item"><strong>Título de la hoja:</strong> ${sheetInfo.title || 'No disponible'}</div>
                                <div class="sheet-item"><strong>ID de la hoja:</strong> ${sheetInfo.sheetId || 'No disponible'}</div>
                                <div class="sheet-item"><strong>Número de filas:</strong> ${sheetInfo.rowCount || 'No disponible'}</div>
                                <div class="sheet-item"><strong>Número de columnas:</strong> ${sheetInfo.columnCount || 'No disponible'}</div>
                                <div class="sheet-item"><strong>Última actualización:</strong> ${sheetInfo.lastUpdate || 'No disponible'}</div>
                                <div class="sheet-item"><strong>Propietario:</strong> ${sheetInfo.owner || 'No disponible'}</div>
                                <div class="sheet-item"><strong>Permisos de acceso:</strong> ${sheetInfo.accessLevel || 'No disponible'}</div>
                            </div>
                            <h2>Información del LLM</h2>
                            <div class="llm-info">
                                <div class="llm-item"><strong>Modelo:</strong> ${llmStatus.model || 'No disponible'}</div>
                                <div class="llm-item"><strong>Estado:</strong> ${llmStatus.status || 'No disponible'}</div>
                                <div class="llm-item"><strong>Última consulta:</strong> ${llmStatus.lastQuery || 'No disponible'}</div>
                                <div class="llm-item"><strong>Tiempo de respuesta promedio:</strong> ${llmStatus.averageResponseTime || 'No disponible'} ms</div>
                                <div class="llm-item"><strong>Consultas totales:</strong> ${llmStatus.totalQueries || 'No disponible'}</div>
                            </div>
                        </div>
                    </div>
                    <div class="logs">
                        <h3>Actividad Reciente</h3>
                        ${activityLogs.map(log => `<div class="log-entry">[${log.time}] ${log.message}</div>`).join('')}
                    </div>
                </body>
            </html>
        `);
    });

    // Nueva ruta para la página de logs en tiempo real
    app.get('/logs', (req, res) => {
        res.sendFile(__dirname + '/public/logs.html');
    });

    server.listen(port)
        .on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.log(`Puerto ${port} en uso, intentando con el siguiente...`);
                port++;
                server.close();
                startWebServer();
            } else {
                console.error('Error al iniciar el servidor:', error);
            }
        })
        .on('listening', () => {
            console.log(`Servidor web iniciado en http://localhost:${port}`);
        });

    return server;
}

module.exports = { startWebServer };
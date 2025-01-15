const express = require('express');
const http = require('http');
const path = require('path')

const ejs = require('ejs');
const { whatsappClientInstance } = require('./whatsapp/whatsappClient');
const {
    checkAndEmitQRStatus,
    checkAndEmitWhatsappStatus 
} = require('./whatsapp/events');
const { Socket } = require('./socket')
const { googleSheetsInstance } = require('./googleSheets');
const { getAppStatus } = require('./appStatus');
const { Logger } = require('./logger');
const { getLLMStatus } = require('./llm/llmHandler');

const app = express();
let port = process.env.PORT || 3001;

// Configura Express para servir archivos estáticos
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

class WebServer {
  static server
  static io

  start(){
    if(WebServer.server){
      return WebServer.server
    }
    WebServer.server = http.createServer(app);
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

      const sheetInfo = googleSheetsInstance.getSheetInfo();
      console.log('Información de la hoja de cálculo:', sheetInfo);
      const logger = new Logger()
      const activityLogs = logger.getLogs();

      const llmStatus = getLLMStatus(); // Obtener el estado del LLM

      res.render('index', {
          appStatus,
          llmStatus,
          sheetInfo,
          activityLogs: activityLogs.map(log => {
              const template = ejs.compile(`<div class="log-entry">[<%= log.time %>] <%= log.message %></div>`)
              return template({ log })
          }),
          qrCode: whatsappClientInstance.getQRStatus()
      });
    });

    // Nueva ruta para la página de logs en tiempo real>
    app.get('/logs', (req, res) => {
        res.sendFile(__dirname + '/public/logs.html');
    });

    WebServer.server.listen(port)
    .on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`Puerto ${port} en uso, intentando con el siguiente...`);
            port++;
            WebServer?.server?.close();
            WebServer.server = null
            this.start();
        } else {
            console.error('Error al iniciar el servidor:', error);
        }
    })
    .on('listening', () => {
        console.log(`Servidor web iniciado en http://localhost:${port}`);
    });

    const socket = new Socket()
    socket.initializeSocket(WebServer.server)
    checkAndEmitQRStatus(Socket.io)
    checkAndEmitWhatsappStatus(Socket.io)
    
    return WebServer.server
  }

  getServer(){
    return this.start()
  }

}

module.exports = {
  WebServer
}
// const server = http.createServer(app);
// const io = initializeSocket(server)

// const startWebServer = () => {

//     checkAndEmitQRStatus(io)
//     checkAndEmitWhatsappStatus(io)

//     app.get('/', (req, res) => {
//         console.log('Solicitud recibida para la página principal');
//         let appStatus;
//         try {
//             appStatus = getAppStatus();
//             console.log('Estado de la aplicación:', appStatus);
//         } catch (error) {
//             console.error('Error al obtener el estado de la aplicación:', error);
//             appStatus = {
//                 whatsappStatus: 'Error',
//                 googleSheetsStatus: 'Error',
//                 webServerStatus: 'Activo',
//                 lastUpdate: new Date().toLocaleString(),
//                 appVersion: 'Error',
//                 environment: process.env.NODE_ENV || 'development'
//             };
//         }

//         const sheetInfo = googleSheetsInstance.getSheetInfo();
//         console.log('Información de la hoja de cálculo:', sheetInfo.title);

//         const activityLogs = logger.getLogs();

//         const llmStatus = getLLMStatus(); // Obtener el estado del LLM

//         res.render('index', {
//             appStatus,
//             llmStatus,
//             sheetInfo,
//             activityLogs: activityLogs.map(log => {
//                 const template = ejs.compile(`<div class="log-entry">[<%= log.time %>] <%= log.message %></div>`)
//                 return template({ log })
//             }),
//             qrCode: whatsappClientInstance.getQRStatus()
//         });
//     });

//     // Nueva ruta para la página de logs en tiempo real>
//     app.get('/logs', (req, res) => {
//         res.sendFile(__dirname + '/public/logs.html');
//     });

//     server.listen(port)
//         .on('error', (error) => {
//             if (error.code === 'EADDRINUSE') {
//                 console.log(`Puerto ${port} en uso, intentando con el siguiente...`);
//                 port++;
//                 server.close();
//                 startWebServer();
//             } else {
//                 console.error('Error al iniciar el servidor:', error);
//             }
//         })
//         .on('listening', () => {
//             console.log(`Servidor web iniciado en http://localhost:${port}`);
//         });

//     return server;
// }

// module.exports = { startWebServer, socketIo: io };
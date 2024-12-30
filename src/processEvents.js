const { WebServer } = require('./webServer');
const singletonInstance = new WebServer()
const server = singletonInstance.getServer()

function processEvents() {
  process.on('SIGINT', () => {
    console.log('Cerrando el servidor...');
    if (server) {
        server.close(() => {
            console.log('Servidor cerrado');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
  });

  // Manejadores para cerrar el servidor correctamente
  process.on('SIGTERM', gracefulShutdown);

  function gracefulShutdown() {
    console.log('Cerrando el servidor...');
    if (server) {
        server.close(() => {
            console.log('Servidor cerrado');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
  }

  // Manejadores de errores globales
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa no manejada rechazada:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Excepción no capturada:', error);
  });
}

module.exports = {
  processEvents
}
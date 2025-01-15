const socketIo = require('socket.io');

class Socket {
  static io

  initializeSocket(server){

    const io = socketIo(server);
        
    function notifyClients(serviceId, newStatus) {
        io.to(serviceId).emit(serviceId, { serviceId, newStatus });
    }
    // Manejo de conexiones de Socket.IO
    io.on('connection', (socket) => {
        console.log('Nuevo cliente conectado');
  
        socket.on('disconnect', () => {
            console.log('Cliente desconectado');
        });
  
        socket.on('subscribe', (serviceId) => {
            // Lógica para suscribir al cliente al servicio
            socket.join(serviceId);
            notifyClients(serviceId, 'Conectado')
        });
    });
    Socket.io = io
  }

  getSocketIO(){
    return Socket.io
  }

}

module.exports = { Socket }
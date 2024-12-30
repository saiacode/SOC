// Cliente (JavaScript en el navegador)
const socket = io(); // Conectarse al servidor

socket.on('connect', () => {
  console.log('Connected to server');

  // Suscribirse a actualizaciones de un servicio específico
  socket.emit('subscribe', 'qrStatus');
});

socket.on('qrStatus', (data) => {
  console.log('Received qr status update:', data);
  // Actualizar la interfaz de usuario con los nuevos datos

  if(Object.hasOwn(data, 'qrCode')){
    document.getElementById('qrContainer').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.qrCode}" class="qr-code"/>`;
  }
});

socket.on('WhatsappStatus', ({ status }) => {
  document.getElementById('whatsappStatus').innerHTML = status;
});

socket.on('llmLastQuery', ({ lastQuery }) => {
  document.getElementById('llmLastQuery').innerHTML = lastQuery;
});

socket.on('llmAverageResponseTime', ({ averageResponseTime }) => {
  document.getElementById('llmAverageResponseTime').innerHTML = averageResponseTime;
});

socket.on('llmTotalQueries', ({ totalQueries }) => {
  document.getElementById('llmTotalQueries').innerHTML = totalQueries;
});

socket.on('newLog', (log) => {
  console.log('newLog', log)
  const $div = document.createElement('div')
  $div.classList.add('log-entry')
  $div.innerHTML = `[${log.time}] ${log.message}`

  document.getElementById('logs').prepend($div)
})
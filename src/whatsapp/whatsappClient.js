const { Client } = require('whatsapp-web.js');
const { handleLLMQuery } = require('../llm/llmHandler');
const { clearPhoneNumber } = require('../utils')

const ejs = require('ejs');

class WhatsAppClass {
  client = null;
  qrCode = null;
  messageHandler = null;
  connected = false;
  chats = []
  messages = {}

  constructor(handleLLMQuery){
    this.client = new Client({
        // Tus opciones de configuración aquí
    });

    this.messageHandler = handleLLMQuery;

    this.client.on('qr', (qr) => {
        this.qrCode = qr;
        console.log('Nuevo código QR recibido');
    });

    this.client.on('ready', async () => {
      this.connected = true
      this.chats = await this.client.getChats()
      console.log('Cliente de WhatsApp listo');
    });

    this.client.on('message', async (message) => {
        console.log('Mensaje recibido:', message.body);
        if (this.messageHandler) {
            try {
              const senderId = clearPhoneNumber(message.from)
              const chat = this.chats.find((priv) => clearPhoneNumber(priv.name) ===  senderId)
              if(!this.messages[senderId]) {
                this.messages[senderId] = await chat.fetchMessages()
              }

              await this.messageHandler(message, message.body, this.messages[senderId]);
            } catch (error) {
              console.error('Error al manejar el mensaje:', error);
              message.reply('Lo siento, ocurrió un error al procesar tu mensaje.');
            }
        } else {
            console.error('No se ha configurado un manejador de mensajes');
        }
    });
    this.client.initialize();
    
  }

  getClient(){
    return this.client
  }

  getClientStatus() {
    if (!this.client) return 'No inicializado';
    if (this.qrCode && !this.connected) return 'Esperando escaneo de QR';
    return this.connected ? 'Conectado' : 'Desconectado';
  }
  
  getQRCode() {
    return this.qrCode;
  }

  getQRStatus() {
    const qrCode = whatsappClientInstance.getQRCode()
    let qrStatus = 'Esperando código QR...'
    if(qrCode){
      const tmp = ejs.compile(`<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=<%= qrCode %>" class="qr-code" >`)
      qrStatus = tmp({ qrCode: encodeURIComponent(qrCode) })
    }
    return qrStatus
  }
}

const whatsappClientInstance = new WhatsAppClass(handleLLMQuery)

module.exports = { whatsappClientInstance }

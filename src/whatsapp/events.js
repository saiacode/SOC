const { whatsappClientInstance } = require('./whatsappClient')

const checkAndEmitQRStatus = (io) => {
  setTimeout(() => {
      const qrCode = whatsappClientInstance.getQRCode()
      console.log('checkeando', qrCode)
      if(qrCode){
          io.emit('qrStatus', { qrCode: encodeURIComponent(qrCode) })
          return true
      }
      return checkAndEmitQRStatus(io)
  }, 2000)
}

const checkAndEmitWhatsappStatus = (io) => {
  setTimeout(() => {
      const status = whatsappClientInstance.getClientStatus()
      console.log('checkeando status', status)
      io.emit('WhatsappStatus', { status })
      if(status === 'Conectado'){
          return true
      }
      return checkAndEmitWhatsappStatus(io)
  }, 2000)
}

module.exports = {
  checkAndEmitQRStatus,
  checkAndEmitWhatsappStatus
}
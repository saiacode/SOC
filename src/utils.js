const clearPhoneNumber = (phoneNumber) => {
  let cleanPhoneNumber = phoneNumber
  if (cleanPhoneNumber.indexOf('@') !== -1){
    cleanPhoneNumber = cleanPhoneNumber.slice(0, cleanPhoneNumber.indexOf('@'))
  }
  return cleanPhoneNumber.replaceAll(/[-+\s]/g, '').trim()
}

const parseConversation = (messages) => {
  const conversation = []
  for(const message of messages){
    if(process.env.WHATSAPP_BOT_CELLPHONE_NUMBER === clearPhoneNumber(message.from)){
      conversation.push({ role: 'assistant', content: message.body })
    }else{
      conversation.push({ role: 'user', content: message.body })
    }
  }
  return conversation
}

module.exports = {
  clearPhoneNumber,
  parseConversation
}
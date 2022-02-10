import sendWhatsAppTemplateMessage from '../../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';

const queue = [];
const callInQueue = (functionToCall) => (...args) => {
  if (queue.length === 0) {
    // if queue is empty
    queue.push(args);
    const timer = setInterval(() => {
      // If queue is empty clear interval
      if (queue.length === 0) {
        clearInterval(timer);
        return;
      }
      // call first function call
      functionToCall(...queue[0]);
      // delete first function call
      queue.shift();
    }, Math.floor(Math.random() * 10) * 1000);
  } else {
    // If queue is more than 0, keep pushing function calls to queue
    queue.push(args);
  }
};

export default callInQueue(sendWhatsAppTemplateMessage);

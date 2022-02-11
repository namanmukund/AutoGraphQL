/* eslint-disable no-console */
import sendWhatsAppTemplateMessage from '../../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';
import addToCommsSendLogs from './addToCommsSendLogs';

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
      console.log('comms log before initialized', queue[0][queue[0].length - 1]);
      if (queue[0][queue[0].length - 1]) {
        console.log('comms log initialized', queue[0][queue[0].length - 1]);
        addToCommsSendLogs({ ...queue[0][queue[0].length - 1] });
      }
      // delete first function call
      queue.shift();
    }, Math.floor(Math.random() * 10) * 1000);
  } else {
    // If queue is more than 0, keep pushing function calls to queue
    queue.push(args);
  }
};

export default callInQueue(sendWhatsAppTemplateMessage);

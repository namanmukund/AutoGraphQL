import Event from './Event';
import EventCategory from './EventCategory';
import EventJoinReason from './EventJoinReason';
import EventPrize from './EventPrize';
import EventSession from './EventSession';
import EventSpeakerProfile from './EventSpeakerProfile';
import CommsVariable from './CommsVariable';
import EventTicket from './EventTicket';
import EventWinner from './EventWinner';
import CommsSendLog from './CommsSendLog';
import EventAttendanceInput from './EventAttendanceInput';

export default [
  ...Event,
  ...EventCategory, ...EventJoinReason, ...EventPrize, ...EventSession,
  ...EventSpeakerProfile, ...CommsVariable,
  ...EventTicket, ...EventWinner, ...CommsSendLog,
  ...EventAttendanceInput,
];

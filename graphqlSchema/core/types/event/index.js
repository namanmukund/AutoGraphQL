import Event from './Event';
import EventCategory from './EventCategory';
import EventJoinReason from './EventJoinReason';
import EventPrize from './EventPrize';
import EventSession from './EventSession';
import EventSpeakerProfile from './EventSpeakerProfile';
import CommsVariable from './CommsVariable';
import EventTicket from './EventTicket';

export default [
  ...Event,
  ...EventCategory, ...EventJoinReason, ...EventPrize, ...EventSession,
  ...EventSpeakerProfile, ...CommsVariable,
  ...EventTicket,
];

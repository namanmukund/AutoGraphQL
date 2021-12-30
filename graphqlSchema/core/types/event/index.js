import Event from './Event';
import EventCategory from './EventCategory';
import EventJoinReason from './EventJoinReason';
import EventPrize from './EventPrize';
import EventSession from './EventSession';
import EventSpeakerProfile from './EventSpeakerProfile';
import WhatsAppCommsVariable from './WhatsAppCommsVariable';

export default [
  ...Event,
  ...EventCategory, ...EventJoinReason, ...EventPrize, ...EventSession,
  ...EventSpeakerProfile, ...WhatsAppCommsVariable,
];

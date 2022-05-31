import ClassroomSessionFilter from './ClassroomSessionFilter';
import ClassroomSessionResult from './ClassroomSessionResult';
import NextOrPrevClassroomSessionInput from './NextOrPrevClassroomSessionInput';
import NextOrPrevClassroomSessionResult from './NextOrPrevClassroomSessionResult';
import SessionComponentMetaResult from './SessionComponentMetaResult';

export default [
  ...ClassroomSessionFilter,
  ...ClassroomSessionResult,
  ...NextOrPrevClassroomSessionInput,
  ...NextOrPrevClassroomSessionResult,
  ...SessionComponentMetaResult,
];

/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchTimetableSchedules = async (schoolConnectId, batchConnectIds) => {
  const query = `
    {
      timetableSchedules(filter: {
        and: [
          {type: workingDay}
          ${batchConnectIds ? `{batch_some: {id_in: ${batchConnectIds}}}` : ''}
          ${schoolConnectId ? `{school_some: {id: "${schoolConnectId}"}}` : ''}
        ]
      }){
        id
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.timetableSchedules', []);
};

const deleteTimetableSchedule = async (scheduleId) => {
  const query = `
  mutation{
    deleteTimetableSchedule(id: "${scheduleId}"){
      id
    }
  }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.deleteTimetableSchedule.id', '');
};

const addTimetableScheduleValidation = async (params) => {
  const { batchConnectIds = [], schoolConnectId, input: { type } } = params;
  // check if working day connect id is passed and if one of the batches/schools has working day already in it
  if (type !== 'workingDay') return true;
  if (batchConnectIds.length > 0 && !schoolConnectId) {
    const timetableSchedules = await fetchTimetableSchedules(null, JSON.stringify(batchConnectIds));
    if (timetableSchedules.length > 0) {
      // delete all existing schedules
      for (const schedule of timetableSchedules) {
        await deleteTimetableSchedule(schedule.id);
      }
    }
  }
  if (schoolConnectId) {
    const timetableSchedules = await fetchTimetableSchedules(schoolConnectId);
    if (timetableSchedules.length > 0) {
      // delete all existing schedules
      // for (const schedule of timetableSchedules) {
      //   await deleteTimetableSchedule(schedule.id);
      // }
    }
  }
  return true;
};

export default addTimetableScheduleValidation;

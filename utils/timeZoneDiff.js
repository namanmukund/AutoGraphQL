import { getTimezone } from 'countries-and-timezones';
import { get } from 'lodash';

const getSlotLabel = (slotNumber) => {
  let startTime = '';
  let endTime = '';

  if (slotNumber < 12) {
    if (slotNumber === 0) {
      startTime = '12 am';
    } else {
      startTime = `${slotNumber} am`;
    }
    if (slotNumber === 11) {
      endTime = '12 pm';
    } else {
      endTime = `${slotNumber + 1} am`;
    }
  } else if (slotNumber === 12) {
    startTime = '12 pm';
    endTime = '1 pm';
  } else if (slotNumber > 12) {
    startTime = `${slotNumber - 12} pm`;
    if (slotNumber === 23) {
      endTime = '12 am';
    } else {
      endTime = `${slotNumber - 11} pm`;
    }
  }

  return {
    startTime,
    endTime,
  };
};

const getIntlDateTime = (date, istTime, targetTimezone) => {
  const timezone = getTimezone(targetTimezone || 'Asia/Kolkata');
  const indianOffset = get(getTimezone('Asia/Kolkata'), 'dstOffset');
  const intlOffset = get(timezone, 'dstOffset');
  const timeDiffInMs = (indianOffset - intlOffset) * 60 * 1000;
  const offsetedSelectedDateInMs = new Date(date).setHours(0, 0, 0, 0) - timeDiffInMs;
  const dateAfterSlotOffset = new Date(
    offsetedSelectedDateInMs + (istTime * 60 * 60 * 1000),
  );
  const intlDate = `${dateAfterSlotOffset.getDate()}-${dateAfterSlotOffset.getMonth() + 1}-${dateAfterSlotOffset.getFullYear()}`;

  // Start Time
  const hourAfterOffset = getSlotLabel(dateAfterSlotOffset.getHours()).startTime.split(' ')[0];
  const minAfterOffset = dateAfterSlotOffset.getMinutes() < 10
    ? `0${dateAfterSlotOffset.getMinutes()}`
    : dateAfterSlotOffset.getMinutes();
  const meridian = getSlotLabel(dateAfterSlotOffset.getHours()).startTime.split(' ')[1];
  const intlStartTime = `${hourAfterOffset}:${minAfterOffset} ${meridian}`;

  // End Time
  const hourAfterOffsetEnd = getSlotLabel(dateAfterSlotOffset.getHours()).endTime.split(' ')[0];
  const minAfterOffsetEnd = dateAfterSlotOffset.getMinutes() < 10
    ? `0${dateAfterSlotOffset.getMinutes()}`
    : dateAfterSlotOffset.getMinutes();
  const meridianEnd = getSlotLabel(dateAfterSlotOffset.getHours()).startTime.split(' ')[1];
  const intlEndTime = `${hourAfterOffsetEnd}:${minAfterOffsetEnd} ${meridianEnd}`;
  return {
    date: intlDate,
    dateObject: new Date(new Date(new Date(new Date().setFullYear(intlDate.split('-')[2], intlDate.split('-')[1] - 1, intlDate.split('-')[0])).setHours(hourAfterOffset)).setMinutes(minAfterOffsetEnd)),
    startTime: intlStartTime.padStart(2, '0'),
    endTime: intlEndTime.padStart(2, '0'),
  };
};

export default getIntlDateTime;

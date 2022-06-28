/* eslint-disable no-restricted-syntax */
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { get } from 'lodash';
import moment from 'moment';
import { callLocalGraphqlApi } from '../../src/api';
import getSelectedSlotsStringArray from '../../src/autoGenerate/graphql/postHookFunctions/utils/getSelectedSlotsStringArray';
import getSlotTimesInString from '../getSlotTimesInString';
import getIntlDateTime from '../timeZoneDiff';

const getBatchSessionForPrevDate = async (bookingDate) => {
  const batchSessionQuery = `{
  batchSessions(
    filter: { and: [{ bookingDate: "${bookingDate}" }, { batch_some: { type_not: b2b } }] }
  ) {
    id
    sessionStatus
    sessionStartDate
    sessionEndDate
    ${getSlotTimesInString()}
    mentorSession {
      id
      user {
        id
        name
      }
    }
    bookingDate
    batch {
      id
      type
      code
    }
    topic {
      id
      order
      title
    }
    course {
      id
      title
    }
  }
}
`;
  const batchSessionRes = await callLocalGraphqlApi(batchSessionQuery);
  return get(batchSessionRes, 'data.batchSessions', []);
};

const scheduleB2cBatchSessionReport = async () => {
  const yesterdayDate = moment().subtract(1, 'day').startOf('day').toISOString();
  const batchSessions = await getBatchSessionForPrevDate(yesterdayDate);
  const batchSessionReportRow = [];
  const GOOGLE_SHEET_ID = '11a2-w_ZiG_-pbEVValUraT4T_2N9RVlX3q4yStS_E3A';
  for (const batchSession of batchSessions) {
    const batchSessionObject = {};
    const {
      bookingDate,
      sessionStartDate,
      sessionEndDate,
      sessionStatus,
    } = batchSession;
    const slotTimeStringArray = getSelectedSlotsStringArray(batchSession);
    if (slotTimeStringArray.length) {
      const slotNumber = slotTimeStringArray[0].split('slot')[1];
      const { startTime } = getIntlDateTime(bookingDate, slotNumber);
      batchSessionObject['Batch Code'] = get(batchSession, 'batch.code');
      batchSessionObject['Batch Type'] = get(batchSession, 'batch.type');
      batchSessionObject['Mentor Name'] = get(batchSession, 'mentorSession.user.name');
      batchSessionObject['Booking Date'] = moment(bookingDate).format('DD-MM-YYYY');
      batchSessionObject['Session Time'] = startTime;
      batchSessionObject['Session Status'] = sessionStatus;
      batchSessionObject['Session Start Time'] = sessionStartDate ? moment(sessionStartDate).format('LLLL') : '';
      batchSessionObject['Session End Time'] = sessionEndDate ? moment(sessionEndDate).format('LLLL') : '';
      batchSessionObject['Session Number'] = get(batchSession, 'topic.order');
      batchSessionObject['Session Topic'] = get(batchSession, 'topic.title');
      batchSessionObject['Course Name'] = get(batchSession, 'course.title');
      batchSessionReportRow.push({ ...batchSessionObject });
    }
  }
  const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);

  //   use service account creds
  await doc.useServiceAccountAuth({
    client_email: 'firebase-adminsdk-qhdaq@sampleapp-88c42.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC2i9qZZc93K46p\n00tgb80J16N76RRaZCDCjTTKls5AoHe8yIo04pwovWLE0bDOby+F1cb8tqkG/wLu\nF1AmoIuv4ctAglGKBD1cccg2ueFkTxgrsRJlBurVCqaKtiuKYU2TsoLiwVD6wLe+\nLj6rDOR25hmC5gzIcOlRGWwCgvG2nrI3mhajTz1Q6xMzEthNLBKBfa75zJpty3b7\ng8pA9uQtAMn3w1ruME2QoE64IiRVdqRcdfb3xd1Y04H4VzkANVWtOyh595qsB8u1\ntlqHXPbmcsfZ7Xwgicv+oGvVWftkWm8AKwaX/l+7RNoMYKnsq/kVPc2byBx11mki\nrH3LPcppAgMBAAECggEAEjTrth4F7bxd68lDvNgZyrADwcGTApr2+4CK8ePNqXt3\nxc/4nOK3MYcGGVxStpw3ULFsOdtcC3MWzzlrCJc9p2qtU39L86iNmDFPB0pN1Svg\nXMc57vKcLGh2COK3gANJcgA9drFSStg621CQdo4AIW28wKYCQ2Gjm6+d6rg1tIF/\nZDY+rMhy8RNhyKDkBsOtsV4N2nBV37hrnKzrRAx7SVszUsjmeV+EtTJ065/WU9gV\nUuovDkBCaOoEEiuaqTr6YjN0Kg34O8HflDCk+yc8cp96A+QLB3ea2Rh3q0tIyAuv\n5LlTiIRXYpIda8thwk0xBDov0kEpbeRn8re9sQy7SQKBgQDaHQG6FPGJFMfswRWl\nSbYxZ3koQf9f4vxp+mTa+vElWhCGonwejHae5EY+Vw0WqBNqAfLfDxTLrNZQUWNm\nXUO3VA+O1q4usWKrRR/UFsINdiiTo58x2L5TCukh6zPAre1tYeI79cEmVjJCSNQE\nz/C3iXinvt/IHawgHgU398/+rQKBgQDWQUPUOQV1Cq3ghCyaIMlrVORiCl9/Hg53\nCf2Mj2hKS7kSq+vfxCB8iLSbr1K9XO1f86VODoMuaXN90ffN+31fj3B5/hC4OU3p\n0nisyj6dxyj8pINSgS93l829Q5VvPTZauLE702pTgGPXHcXhz3Ef2RLANphoHtWj\nEpGtTqTeLQKBgFOgAXR96SlcrVZppUntHAyPFpXH0AjMd2iOlzKaOfDPOjzUeXAg\n/K3o6cGnEJ6aLG9ddeft2VRJ3RWITusFYRwd/6UNTFUcr67o3s4rN5V/swkAF949\nsqMWMNJPYlVCmiBxAhNpIvf23mgpkhiSPUGxVHBEL3qDXeYmfGu7+KQ1AoGAdrBm\n89y2sjS9R9/QmX1KN0Qq1EjsyA2Nc9I7/C7BVk8Gclp861PJr1NHweroye/9q6bc\nTxZpAz/1c6DqRthnhpV+eIYPGw7bo4ktwoKzF1Jp2TMFcKIR+o1EsvEKijn9r1ob\nDIo8n49DP7rFkScKgtsMsSBNY3iZXqH9w2UKne0CgYBQuC1zhALKeYyQm4Dwdrbp\n9xnCRFahcMVtFwxRDdN7U8BokNnDAEORP7uBJQbbbQ/iyd2M0EBFiHuMGPOmCtJl\nF59UIjUMz5ixkXa354ZZBQ7zJMcjm410Nz9z6HU1KKEF7SQQPl/XqENcYCz8xMrO\nBDZwfxjgjNs7tfEnjQF3UA==\n-----END PRIVATE KEY-----\n',
  });

  await doc.loadInfo(); // loads document properties and worksheets
  const sheet = doc.sheetsByIndex[0]; // Get the 1st sheet
  sheet.addRows(batchSessionReportRow);
};

export default scheduleB2cBatchSessionReport;

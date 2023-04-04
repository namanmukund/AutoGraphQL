/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-unused-vars */
/* eslint-disable no-restricted-syntax */
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { get, sortBy } from 'lodash';
import { QueryController } from '../../../src/autoGenerate/graphql/controllers';
import MasterController from '../../../src/autoGenerate/graphql/controllers/MasterController';

const CHUNKS_COUNT = 100;

const getDatabaseControllers = () => {
  const authentication = { bypass: true };

  const batchController = new QueryController('Batch', authentication);

  const userSessionReportController = new MasterController('UserLevelSessionReport', {
    bypass: true,
  });

  return {
    userSessionReportController,
    batchController,
  };
};

const trainingBatchesAggregationQuery = () => [
  {
    $match: {
      isTeacherTraining: true,
    },
  },
  {
    $project: {
      id: 1,
      classroomTitle: 1,
    },
  },
];

const scheduleTeacherTrainingReports = async () => {
  const GOOGLE_SHEET_ID = '1DXh7-OJlFHRGKDB7vDYGJvbXLEzCbWj2MD3Dl-TDutw';
  const { batchController, userSessionReportController } = getDatabaseControllers();
  const batches = await batchController.aggregate(trainingBatchesAggregationQuery());
  const batchesIds = batches.filter((batch) => get(batch, 'classroomTitle')).map((batch) => get(batch, 'id'));
  const userSessionReports = await userSessionReportController.Model.findAll({
    where: {
      classroomId: batchesIds,
    },
    raw: true,
  });
  const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);
  const sessionReportsArray = [];
  for (const userSessionReport of userSessionReports) {
    const {
      userId,
      userName,
      userRole,
      classroomTitle,
      schoolName,
      sessionTitle,
      sessionStatus,
      teacherTaughtName,
      teacherTaughtId,
      homeworkVisited,
      homeworkAttempted,
      homeworkScore = 0,
      homeworkExists,
      homeworkQuizLog = [],
    } = userSessionReport;
    if (userRole === 'TeacherTraining') {
      const sortHomeworkQuizLog = (sortBy(homeworkQuizLog, 'mongoDocUpdatedAt') || []);
      let correctQuestionCount = 0;
      let inCorrectQuestionCount = 0;
      let totalQuestionCount = 0;
      let unansweredQuestionCount = 0;
      if (sortHomeworkQuizLog && sortHomeworkQuizLog.length && sortHomeworkQuizLog[sortHomeworkQuizLog.length - 1]) {
        const homeworkQuizReport = get(sortHomeworkQuizLog[sortHomeworkQuizLog.length - 1], 'recordRawDump[0]');
        if (homeworkQuizReport) {
          correctQuestionCount = get(homeworkQuizReport, 'correctQuestionCount');
          inCorrectQuestionCount = get(homeworkQuizReport, 'inCorrectQuestionCount');
          totalQuestionCount = get(homeworkQuizReport, 'totalQuestionCount');
          unansweredQuestionCount = get(homeworkQuizReport, 'unansweredQuestionCount');
        }
      }
      let assignmentScore = (totalQuestionCount && correctQuestionCount) ? ((correctQuestionCount / totalQuestionCount) * 100) : 0;
      assignmentScore = Number(assignmentScore.toFixed(0));
      let homeworkScoreValue = Number(homeworkScore.toFixed(0));
      if (homeworkScoreValue !== assignmentScore) {
        // Additional check to verify the score
        homeworkScoreValue = assignmentScore;
      }
      sessionReportsArray.push({
        teacherName: userName,
        classroomTitle,
        schoolName,
        sessionTitle,
        sessionStatus,
        trainerTaughtName: teacherTaughtName,
        assignmentExists: homeworkExists,
        'assignmentVisited %': homeworkVisited,
        'assignmentAttempted %': homeworkAttempted,
        totalAssignmentCount: totalQuestionCount,
        correctAssignmentCount: correctQuestionCount,
        inCorrectAssignmentCount: inCorrectQuestionCount,
        unansweredAssignmentCount: unansweredQuestionCount,
        'assignmentScore %': homeworkScoreValue,
      });
    }
  }
  await doc.useServiceAccountAuth({
    client_email: 'firebase-adminsdk-qhdaq@sampleapp-88c42.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC2i9qZZc93K46p\n00tgb80J16N76RRaZCDCjTTKls5AoHe8yIo04pwovWLE0bDOby+F1cb8tqkG/wLu\nF1AmoIuv4ctAglGKBD1cccg2ueFkTxgrsRJlBurVCqaKtiuKYU2TsoLiwVD6wLe+\nLj6rDOR25hmC5gzIcOlRGWwCgvG2nrI3mhajTz1Q6xMzEthNLBKBfa75zJpty3b7\ng8pA9uQtAMn3w1ruME2QoE64IiRVdqRcdfb3xd1Y04H4VzkANVWtOyh595qsB8u1\ntlqHXPbmcsfZ7Xwgicv+oGvVWftkWm8AKwaX/l+7RNoMYKnsq/kVPc2byBx11mki\nrH3LPcppAgMBAAECggEAEjTrth4F7bxd68lDvNgZyrADwcGTApr2+4CK8ePNqXt3\nxc/4nOK3MYcGGVxStpw3ULFsOdtcC3MWzzlrCJc9p2qtU39L86iNmDFPB0pN1Svg\nXMc57vKcLGh2COK3gANJcgA9drFSStg621CQdo4AIW28wKYCQ2Gjm6+d6rg1tIF/\nZDY+rMhy8RNhyKDkBsOtsV4N2nBV37hrnKzrRAx7SVszUsjmeV+EtTJ065/WU9gV\nUuovDkBCaOoEEiuaqTr6YjN0Kg34O8HflDCk+yc8cp96A+QLB3ea2Rh3q0tIyAuv\n5LlTiIRXYpIda8thwk0xBDov0kEpbeRn8re9sQy7SQKBgQDaHQG6FPGJFMfswRWl\nSbYxZ3koQf9f4vxp+mTa+vElWhCGonwejHae5EY+Vw0WqBNqAfLfDxTLrNZQUWNm\nXUO3VA+O1q4usWKrRR/UFsINdiiTo58x2L5TCukh6zPAre1tYeI79cEmVjJCSNQE\nz/C3iXinvt/IHawgHgU398/+rQKBgQDWQUPUOQV1Cq3ghCyaIMlrVORiCl9/Hg53\nCf2Mj2hKS7kSq+vfxCB8iLSbr1K9XO1f86VODoMuaXN90ffN+31fj3B5/hC4OU3p\n0nisyj6dxyj8pINSgS93l829Q5VvPTZauLE702pTgGPXHcXhz3Ef2RLANphoHtWj\nEpGtTqTeLQKBgFOgAXR96SlcrVZppUntHAyPFpXH0AjMd2iOlzKaOfDPOjzUeXAg\n/K3o6cGnEJ6aLG9ddeft2VRJ3RWITusFYRwd/6UNTFUcr67o3s4rN5V/swkAF949\nsqMWMNJPYlVCmiBxAhNpIvf23mgpkhiSPUGxVHBEL3qDXeYmfGu7+KQ1AoGAdrBm\n89y2sjS9R9/QmX1KN0Qq1EjsyA2Nc9I7/C7BVk8Gclp861PJr1NHweroye/9q6bc\nTxZpAz/1c6DqRthnhpV+eIYPGw7bo4ktwoKzF1Jp2TMFcKIR+o1EsvEKijn9r1ob\nDIo8n49DP7rFkScKgtsMsSBNY3iZXqH9w2UKne0CgYBQuC1zhALKeYyQm4Dwdrbp\n9xnCRFahcMVtFwxRDdN7U8BokNnDAEORP7uBJQbbbQ/iyd2M0EBFiHuMGPOmCtJl\nF59UIjUMz5ixkXa354ZZBQ7zJMcjm410Nz9z6HU1KKEF7SQQPl/XqENcYCz8xMrO\nBDZwfxjgjNs7tfEnjQF3UA==\n-----END PRIVATE KEY-----\n',
  });

  await doc.loadInfo(); // loads document properties and worksheets
  const sheet = doc.sheetsByIndex[0]; // Get the 1st sheet
  const headerValues = [];
  sessionReportsArray.forEach((row) => {
    (Object.keys(row) || []).forEach((head) => {
      if (!headerValues.includes(head)) {
        headerValues.push(head);
      }
    });
  });
  await sheet.clear();
  await sheet.setHeaderRow(headerValues);
  const batchedSessionReports = [];
  // Adding the data to sheet in chunks (100 at a time)
  for (let sessionCount = 0; sessionCount < sessionReportsArray.length; sessionCount += CHUNKS_COUNT) {
    const sessions = sessionReportsArray.filter((_, ind) => ind >= sessionCount && ind < (sessionCount + CHUNKS_COUNT));
    batchedSessionReports.push(sessions);
  }
  for (const batchedSessionReport of batchedSessionReports) {
    await sheet.addRows(batchedSessionReport);
  }
  console.log('~~~~~ Sheet updated with latest report ~~~~~');
};

export default scheduleTeacherTrainingReports;

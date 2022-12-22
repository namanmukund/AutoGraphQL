/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-loop-func */
/* eslint-disable no-case-declarations */
/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable no-console */
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { get } from 'lodash';
import cuid from 'cuid';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { OLD_COURSE_ID } from '../../../../../../constants';
import MasterController from '../../../controllers/MasterController';

const defaultColumns = [
  'Name',
  'User Role',
  'Grade',
  'Section',
  'Classroom Title',
  'School',
  'Teacher Name',
  'Session Course',
  'Session Title',
  'Session Type',
  'Course Category',
  'Class Start',
  'Class End',
  'Class Duration (In Hours)',
  'Email',
  'Student Attendance Status',
  'Classwork Visited',
  'Classwork Attempted',
  'Homework Visited',
  'Homework Attempted',
  'Classwork Score',
  'Homework Score',
  'Proficiency',
  'Homework Exists ?',
  'Video Exists',
  'Video Attempted',
  'PQ Exists',
  'PQ Visited',
  'PQ Attempted',
  'PQ FirstTryCount:1',
  'PQ SecondTryCount:1',
  'PQ ThirdTryCount:1',
  'PQ FirstTryCount:2',
  'PQ SecondTryCount:2',
  'PQ ThirdTryCount:2',
  'PQ FirstTryCount:3',
  'PQ SecondTryCount:3',
  'PQ ThirdTryCount:3',
  'Classwork Assignment Exists',
  'Classwork Assignment Visited',
  'Classwork Assignment Attempted',
  'Classwork Assignment Codes',
  'Homework Assignment Exists',
  'Homework Assignment Visited',
  'Homework Assignment Attempted',
  'Homework Assignment Codes',
  'Classwork Practice Exists:1',
  'Classwork Practice Visited:1',
  'Classwork Practice Attempted:1',
  'Classwork Practice Link:1',
  'Homework Practice Exists:1',
  'Homework Practice Visited:1',
  'Homework Practice Attempted:1',
  'Homework Practice Link:1',
  'Classwork Practice Exists:2',
  'Classwork Practice Visited:2',
  'Classwork Practice Attempted:2',
  'Classwork Practice Link:2',
  'Homework Practice Exists:2',
  'Homework Practice Visited:2',
  'Homework Practice Attempted:2',
  'Homework Practice Link:2',
  'Classwork Practice Exists:3',
  'Classwork Practice Visited:3',
  'Classwork Practice Attempted:3',
  'Classwork Practice Link:3',
  'Homework Practice Exists:3',
  'Homework Practice Visited:3',
  'Homework Practice Attempted:3',
  'Homework Practice Link:3',
  'Classwork Practice Exists:4',
  'Classwork Practice Visited:4',
  'Classwork Practice Attempted:4',
  'Classwork Practice Link:4',
  'Homework Practice Exists:4',
  'Homework Practice Visited:4',
  'Homework Practice Attempted:4',
  'Homework Practice Link:4',
  'Classwork Project Exists',
  'Classwork Project Visited',
  'Classwork Project Attempted',
  'Classwork Project Link',
  'Homework Quiz Exists',
  'Homework Quiz Attempted',
  'Total Quiz Question Count',
  'Correct Question Count',
  'In Correct Question Count',
  'Unanswered Question Count',
  'Mastery Level',
];

const getUniqueCount = (obj, label, index) => {
  if (!obj[`${label}${index}`]) return index;
  return getUniqueCount(obj, label, index + 1);
};

const getIdArrForQuery = (idArr) => {
  let arr = '';
  if (idArr) {
    idArr.forEach((id) => {
      arr += `"${id}",`;
    });
    if (arr.length && arr[arr.length - 1] === ',') {
      arr.substring(0, arr.length - 1);
    }
  }
  return arr;
};

const updateSheet = async (result, GOOGLE_SHEET_ID) => {
  const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);

  //   use service account creds
  await doc.useServiceAccountAuth({
    client_email: 'firebase-adminsdk-qhdaq@sampleapp-88c42.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC2i9qZZc93K46p\n00tgb80J16N76RRaZCDCjTTKls5AoHe8yIo04pwovWLE0bDOby+F1cb8tqkG/wLu\nF1AmoIuv4ctAglGKBD1cccg2ueFkTxgrsRJlBurVCqaKtiuKYU2TsoLiwVD6wLe+\nLj6rDOR25hmC5gzIcOlRGWwCgvG2nrI3mhajTz1Q6xMzEthNLBKBfa75zJpty3b7\ng8pA9uQtAMn3w1ruME2QoE64IiRVdqRcdfb3xd1Y04H4VzkANVWtOyh595qsB8u1\ntlqHXPbmcsfZ7Xwgicv+oGvVWftkWm8AKwaX/l+7RNoMYKnsq/kVPc2byBx11mki\nrH3LPcppAgMBAAECggEAEjTrth4F7bxd68lDvNgZyrADwcGTApr2+4CK8ePNqXt3\nxc/4nOK3MYcGGVxStpw3ULFsOdtcC3MWzzlrCJc9p2qtU39L86iNmDFPB0pN1Svg\nXMc57vKcLGh2COK3gANJcgA9drFSStg621CQdo4AIW28wKYCQ2Gjm6+d6rg1tIF/\nZDY+rMhy8RNhyKDkBsOtsV4N2nBV37hrnKzrRAx7SVszUsjmeV+EtTJ065/WU9gV\nUuovDkBCaOoEEiuaqTr6YjN0Kg34O8HflDCk+yc8cp96A+QLB3ea2Rh3q0tIyAuv\n5LlTiIRXYpIda8thwk0xBDov0kEpbeRn8re9sQy7SQKBgQDaHQG6FPGJFMfswRWl\nSbYxZ3koQf9f4vxp+mTa+vElWhCGonwejHae5EY+Vw0WqBNqAfLfDxTLrNZQUWNm\nXUO3VA+O1q4usWKrRR/UFsINdiiTo58x2L5TCukh6zPAre1tYeI79cEmVjJCSNQE\nz/C3iXinvt/IHawgHgU398/+rQKBgQDWQUPUOQV1Cq3ghCyaIMlrVORiCl9/Hg53\nCf2Mj2hKS7kSq+vfxCB8iLSbr1K9XO1f86VODoMuaXN90ffN+31fj3B5/hC4OU3p\n0nisyj6dxyj8pINSgS93l829Q5VvPTZauLE702pTgGPXHcXhz3Ef2RLANphoHtWj\nEpGtTqTeLQKBgFOgAXR96SlcrVZppUntHAyPFpXH0AjMd2iOlzKaOfDPOjzUeXAg\n/K3o6cGnEJ6aLG9ddeft2VRJ3RWITusFYRwd/6UNTFUcr67o3s4rN5V/swkAF949\nsqMWMNJPYlVCmiBxAhNpIvf23mgpkhiSPUGxVHBEL3qDXeYmfGu7+KQ1AoGAdrBm\n89y2sjS9R9/QmX1KN0Qq1EjsyA2Nc9I7/C7BVk8Gclp861PJr1NHweroye/9q6bc\nTxZpAz/1c6DqRthnhpV+eIYPGw7bo4ktwoKzF1Jp2TMFcKIR+o1EsvEKijn9r1ob\nDIo8n49DP7rFkScKgtsMsSBNY3iZXqH9w2UKne0CgYBQuC1zhALKeYyQm4Dwdrbp\n9xnCRFahcMVtFwxRDdN7U8BokNnDAEORP7uBJQbbbQ/iyd2M0EBFiHuMGPOmCtJl\nF59UIjUMz5ixkXa354ZZBQ7zJMcjm410Nz9z6HU1KKEF7SQQPl/XqENcYCz8xMrO\nBDZwfxjgjNs7tfEnjQF3UA==\n-----END PRIVATE KEY-----\n',
  });

  await doc.loadInfo(); // loads document properties and worksheets
  const sheet = doc.sheetsByIndex[0]; // Get the 1st sheet
  const headerValues = [];
  result.forEach((row) => {
    (Object.keys(row) || []).forEach((head) => {
      if (!headerValues.includes(head)) {
        headerValues.push(head);
      }
    });
  });
  await sheet.clear();
  await sheet.setHeaderRow(headerValues);
  sheet.addRows(result);
  console.log('~~~~~~~~~~~~~~~ Sheet updated ~~~~~~~~~~~~~~~~~~');
};

const getReportObj = ({
  userId, isTeacherReportFlow, allMentorMenteeSessions, allQuizReportRes, allPqReport, allUserAssignments, allUserVideos, allLos,
  allUserBBPracticeCWs, allUserBBPracticeHWs, allUserBBProjectCWs, elem, student, sessionDetail,
}) => {
  if (userId) {
    const { sessionStartDate, sessionEndDate, sessionDurationInHr } = sessionDetail;
    // console.log('----------------------userId---------------', userId);
    // eslint-disable-next-line no-await-in-loop
    // const mmsRes = await callLocalGraphqlApi(
    //   mentorMenteeSessionsQuery(userId, topicId),
    // );
    const mentorMenteeSession = (allMentorMenteeSessions || []).find((el) => get(el, 'menteeSession.user.id') === userId);
    // eslint-disable-next-line no-await-in-loop
    // const quizRes = await callLocalGraphqlApi(
    //   quizReportQuery(userId, topicId),
    // );
    const quizReport = (allQuizReportRes || []).find((el) => get(el, 'user.id') === userId);

    // eslint-disable-next-line no-await-in-loop
    // const pqRes = await callLocalGraphqlApi(
    //   pqReportQuery(userId, topicId),
    // );
    const pqReports = (allPqReport || []).filter((el) => get(el, 'user.id') === userId);

    const userLos = (allLos || []).filter((el) => get(el, 'user.id') === userId);

    const userVideo = (allUserVideos || []).filter((el) => get(el, 'user.id') === userId);

    const userAssignmentRes = (allUserAssignments || []).find((el) => get(el, 'user.id') === userId);

    // const userAssignmentHWData = allUserAssignmentHWData.find((el) => get(el, 'user.id') === userId);

    const userBBPracticeCW = (allUserBBPracticeCWs || []).filter((el) => get(el, 'user.id') === userId);

    const userBBPracticeHW = (allUserBBPracticeHWs || []).filter((el) => get(el, 'user.id') === userId);

    const userBBProjectCW = (allUserBBProjectCWs || []).find((el) => get(el, 'user.id') === userId);

    let isAssignmentExistsForCourse = false;
    let isAssignmentHWExistsForCourse = false;
    let isPracticeCWExistsForCourse = false;
    let isPracticeHWExistsForCourse = false;
    let isProjectCWExistsForCourse = false;
    let isQuizHWExistsForCourse = false;
    // console.info('~~~~~ TOPIC ~~~~~', JSON.stringify(elem.topic));
    let classworkCompletionCount = 0;
    let classworkAttemptedCount = 0;
    let homeworkCompletionCount = 0;
    let homeworkAttemptedCount = 0;
    let totalClassworkCount = 0;
    let totalHomeworkCount = 0;
    const videoComponentLog = [];
    const pqComponentLog = [];
    const classworkAssignmentLog = [];
    const homeworkAssignmentLog = [];
    const classworkPracticeLog = [];
    const homeworkPracticeLog = [];
    const classworkProjectLog = [];
    const homeworkQuizLog = [];
    let sessionClassworkComponents = [];
    let sessionHomeworkComponents = [];
    if (
      elem.topic
            && elem.topic.topicComponentRule
            && elem.topic.topicComponentRule.length
    ) {
      const topicComponentRule = elem.topic.topicComponentRule;

      sessionClassworkComponents = topicComponentRule.filter((tc) => !['quiz', 'homeworkAssignment', 'homeworkPractice'].includes(get(tc, 'componentName')));
      sessionHomeworkComponents = topicComponentRule.filter((tc) => ['quiz', 'homeworkAssignment', 'homeworkPractice'].includes(get(tc, 'componentName')));
      console.info(topicComponentRule.map((tc) => tc.componentName));
      totalClassworkCount = topicComponentRule.filter((tc) => ['video', 'assignment', 'blockBasedPractice', 'blockBasedProject', 'learningObjective'].includes(get(tc, 'componentName'))).length;
      totalHomeworkCount = topicComponentRule.filter((tc) => ['quiz', 'homeworkAssignment', 'homeworkPractice'].includes(get(tc, 'componentName'))).length;
      topicComponentRule
      // .map((tc) => tc.componentName)
        .forEach((tc) => {
          const el = tc.componentName;
          if (el === 'assignment') {
            isAssignmentExistsForCourse = true;
            if (userAssignmentRes) {
              classworkCompletionCount += 1;
              const isAttempted = get(userAssignmentRes, 'assignment', []).some((a) => (get(a, 'userAnswerCodeSnippet') && !get(a, 'assignmentQuestion.isHomework')));
              if (isAttempted) {
                classworkAttemptedCount += 1;
              }
            }
          } else if (el === 'homeworkAssignment') {
            isAssignmentHWExistsForCourse = true;
            if (userAssignmentRes) {
              homeworkCompletionCount += 1;
              const isAttempted = get(userAssignmentRes, 'assignment', []).some((a) => (get(a, 'userAnswerCodeSnippet') && get(a, 'assignmentQuestion.isHomework')));
              if (isAttempted) {
                homeworkAttemptedCount += 1;
              }
            }
          } else if (el === 'blockBasedPractice') {
            isPracticeCWExistsForCourse = true;
            const userBBPracticeCWData = (userBBPracticeCW || []).find((practice) => get(practice, 'blockBasedPractice.id') === get(tc, 'blockBasedProject.id'));
            if (userBBPracticeCWData) {
              classworkCompletionCount += 1;
              const isAttempted = get(userBBPracticeCWData, 'blockBasedPractice.isSubmitAnswer') ? get(userBBPracticeCWData, 'answerLink') || get(userBBPracticeCWData, 'savedBlocks') : true;
              if (isAttempted) {
                classworkAttemptedCount += 1;
              }
            }
          } else if (el === 'homeworkPractice') {
            isPracticeHWExistsForCourse = true;
            const userBBPracticeHWData = (userBBPracticeHW || []).find((practice) => get(practice, 'blockBasedPractice.id') === get(tc, 'blockBasedProject.id'));
            if (userBBPracticeHWData) {
              homeworkCompletionCount += 1;
              const isAttempted = get(userBBPracticeHWData, 'blockBasedPractice.isSubmitAnswer') ? get(userBBPracticeHWData, 'answerLink') || get(userBBPracticeHWData, 'savedBlocks') : true;
              if (isAttempted) {
                homeworkAttemptedCount += 1;
              }
            }
          } else if (el === 'blockBasedProject') {
            isProjectCWExistsForCourse = true;
            if (userBBProjectCW) {
              classworkCompletionCount += 1;
              const isAttempted = get(userBBProjectCW, 'answerLink') || get(userBBProjectCW, 'savedBlocks');
              if (isAttempted) {
                classworkAttemptedCount += 1;
              }
            }
          } else if (el === 'quiz') {
            isQuizHWExistsForCourse = true;
            if (get(quizReport, 'quizReport.totalQuestionCount')) homeworkCompletionCount += 1;
            if (get(quizReport, 'quizReport.correctQuestionCount') || get(quizReport, 'quizReport.inCorrectQuestionCount') || get(quizReport, 'quizReport.unansweredQuestionCount')) homeworkAttemptedCount += 1;
          } else if ((el === 'learningObjective')) {
            const userLoRes = userLos.find((lo) => get(lo, 'learningObjective.id') === get(tc, 'learningObjective.id'));
            const pqReportRes = pqReports.find((pq) => get(pq, 'learningObjective.id') === get(tc, 'learningObjective.id'));
            if (userLoRes) classworkCompletionCount += 1;
            if (pqReportRes) classworkAttemptedCount += 1;
          } else if (el === 'video') {
            if (userVideo) {
              classworkCompletionCount += 1;
              classworkAttemptedCount += 1;
            }
          }
        });
    }
    if (
      elem.topic
            && elem.topic.courses
            && elem.topic.courses.findIndex((el) => el.id === OLD_COURSE_ID) !== -1
    ) {
      console.info('~~~~~~~PYTHON COURSE~~~~~~~~~');
      isAssignmentExistsForCourse = true;
      isAssignmentHWExistsForCourse = true;
      isQuizHWExistsForCourse = true;
      isPracticeCWExistsForCourse = false;
      isPracticeHWExistsForCourse = false;
      isProjectCWExistsForCourse = false;
    }

    // let isClassWorkPracticeSubmitted = '';
    const ClassWorkPracticeLink = '';
    const isHomeworkPracticeSubmitted = '';
    const HomeworkPracticeLink = '';
    let isClassWorkProjectSubmitted = '';
    let ClassWorkProjectLink = '';
    let isClassWorkAssignmentSubmitted = '';
    let ClassWorkAssignmentCode = '';
    let HomeworkAssignmentCode = '';

    // Classwork Assignment
    if (isAssignmentExistsForCourse) {
      // eslint-disable-next-line no-await-in-loop
      // const userAssignmentRes = await callLocalGraphqlApi(
      //   userAssignmentQuery(userId, topicId),
      // );
      const userAssignmentId = get(userAssignmentRes, 'id');
      isClassWorkAssignmentSubmitted = !!userAssignmentId;
      // console.log(
      //   '~~~ ASSIGNMENT CODE ~~~~',
      //   JSON.stringify(userAssignmentRes),
      // );
      const classworkAssignment = {};
      if (userAssignmentRes) {
        classworkAssignment.codingAssignmentId = userAssignmentId;
        classworkAssignment.visited = true;
        classworkAssignment.attempted = true;
        classworkAssignment.questions = [];
        get(userAssignmentRes, 'assignment', []).forEach(
          (el, index) => {
            if (el && !get(el, 'assignmentQuestion.isHomework')) {
              classworkAssignment.questions.push({
                codingAssignmentId: get(el, 'assignmentQuestion.id'),
                attempted: !!get(el, 'userAnswerCodeSnippet'),
                code: get(el, 'userAnswerCodeSnippet') && get(el, 'userAnswerCodeSnippet') !== 'null' ? get(el, 'userAnswerCodeSnippet') : '',
              });
            }
            if (el && el.userAnswerCodeSnippet && !get(el, 'assignmentQuestion.isHomework')) {
              ClassWorkAssignmentCode += `${index + 1}. ${
                el.userAnswerCodeSnippet
              } \n`;
            }
          },
        );
        classworkAssignmentLog.push({ ...classworkAssignment });
      }
    }

    // Homework Assignment
    if (isAssignmentHWExistsForCourse) {
      // eslint-disable-next-line no-await-in-loop
      // const userAssignmentHWRes = await callLocalGraphqlApi(
      //   userAssignmentHWQuery(userId, topicId),
      // );
      const homeworkAssignment = {};
      if (userAssignmentRes) {
        const userAssignmentId = get(userAssignmentRes, 'id');
        homeworkAssignment.codingAssignmentId = userAssignmentId;
        homeworkAssignment.visited = true;
        homeworkAssignment.attempted = true;
        homeworkAssignment.questions = [];
        get(userAssignmentRes, 'assignment', []).forEach(
          (el, index) => {
            if (el && get(el, 'assignmentQuestion.isHomework')) {
              homeworkAssignment.questions.push({
                codingAssignmentId: get(el, 'assignmentQuestion.id'),
                attempted: !!get(el, 'userAnswerCodeSnippet'),
                code: get(el, 'userAnswerCodeSnippet') && get(el, 'userAnswerCodeSnippet') !== 'null' ? get(el, 'userAnswerCodeSnippet') : '',
              });
            }
            if (el && el.userAnswerCodeSnippet && get(el, 'assignmentQuestion.isHomework')) {
              HomeworkAssignmentCode += `${index + 1}. ${
                el.userAnswerCodeSnippet
              } \n`;
            }
          },
        );
        homeworkAssignmentLog.push({ ...homeworkAssignment });
      }
    }

    // BlockBasedPractice Classwork
    // if (isPracticeCWExistsForCourse) {
    //   // eslint-disable-next-line no-await-in-loop
    //   const userBBPracticeCWId = get(
    //     userBBPracticeCW,
    //     'id',
    //     '',
    //   );
    //   isClassWorkPracticeSubmitted = !!userBBPracticeCWId;
    //   ClassWorkPracticeLink = get(
    //     userBBPracticeCW,
    //     'answerLink',
    //   );
    // }

    // BlockBasedPratice Homework
    // if (isPracticeHWExistsForCourse) {
    //   // eslint-disable-next-line no-await-in-loop
    //   const userBBPracticeHWId = get(
    //     userBBPracticeHW,
    //     'id',
    //     '',
    //   );
    //   isHomeworkPracticeSubmitted = !!userBBPracticeHWId;
    //   HomeworkPracticeLink = get(
    //     userBBPracticeHW,
    //     'answerLink',
    //     '',
    //   );
    // }

    // BlockBasedProject Classwork
    if (isProjectCWExistsForCourse) {
      // eslint-disable-next-line no-await-in-loop
      const userBBProjectCWId = get(
        userBBProjectCW,
        'id',
        '',
      );
      isClassWorkProjectSubmitted = !!userBBProjectCWId;
      ClassWorkProjectLink = get(
        userBBProjectCW,
        'answerLink',
        '',
      );
    }

    const defaultValue = '  ';
    const userName = isTeacherReportFlow ? get(elem, 'batch.allottedMentor.name', '') : student
      && student.student
      && student.student.user
      && student.student.user.name;
    const userEmail = isTeacherReportFlow ? get(elem, 'batch.allottedMentor.email', '') : student
      && student.student
      && student.student.parents
      && student.student.parents.length
      && student.student.parents[0]
      && student.student.parents[0].user
      && student.student.parents[0].user.email;
    const batchGrade = get(elem, 'batch.classes.0.grade');
    const batchSection = get(elem, 'batch.classes.0.section');
    let obj = {
      userName,
      userRole: isTeacherReportFlow ? 'Teacher' : 'Student',
      studentGrade: isTeacherReportFlow ? batchGrade : (student && student.student && student.student.grade) || '',
      studentSection: isTeacherReportFlow ? batchSection : (student && student.student && student.student.section) || '',
      schoolName: get(elem, 'batch.school.name', ''),
      // 'Classroom Title': elem.batch && (elem.batch.classroomTitle || elem.batch.code),
      teacherTaughtId: get(elem, 'mentorSession.user.id') || (elem.batch && elem.batch.allottedMentor && elem.batch.allottedMentor.id),
      teacherTaughtName: get(elem, 'mentorSession.user.name') || (elem.batch && elem.batch.allottedMentor && elem.batch.allottedMentor.name),
      // 'Session Course': elem.topic && elem.topic.courses && elem.topic.courses[0].title,
      // 'Session Title': elem.topic && elem.topic.title,
      // 'Session Type': elem.topic && elem.topic.classType,
      courseCategory: elem.topic && elem.topic.courses && elem.topic.courses[0].category,
      sessionStart: sessionStartDate ? new Date(sessionStartDate) : null,
      sessionEnd: sessionEndDate ? new Date(sessionEndDate) : null,
      sessionDuration: Math.round(sessionDurationInHr || 0),
      studentAttendance: (!!(student && student.status === 'present')),
      classroomStudentsCount: (get(elem, 'attendance', []) || []).length,
      classroomId: get(elem, 'batch.id'),
      classroomTitle: get(elem, 'batch.classroomTitle'),
      schoolId: get(elem, 'batch.school.id'),
      topicId: get(elem, 'topic.id'),
      sessionId: get(elem, 'id'),
      sessionTitle: get(elem, 'topic.title'),
      sessionType: get(elem, 'topic.classType'),
      courseTitle: get(elem, 'topic.courses[0].title'),
      courseId: get(elem, 'topic.courses[0].id'),
      sessionStatus: get(elem, 'sessionStatus'),
      userId: isTeacherReportFlow ? get(elem, 'batch.allottedMentor.id', '') : get(student, 'student.user.id'),
      sessionClassworkComponents,
      sessionHomeworkComponents,
    };
    const additionalObj = {};
    let firstTryCount = 0;
    let secondTryCount = 0;
    let threeOrMoreTryCount = 0;
    let totalCount = 0;
    if (
      elem.topic
            && elem.topic.topicComponentRule
            && elem.topic.topicComponentRule.length
    ) {
      const topicComponentRule = elem.topic.topicComponentRule;
      topicComponentRule
      // .map((tc) => tc.componentName)
        .forEach((tc) => {
          const el = tc.componentName;
          let componentObj = {};
          if (el === 'video') {
            componentObj.videoId = get(tc, 'video.id');
            // additionalObj['Video Exists'] = 'Yes';
            if (userVideo) componentObj.attempted = true;
            else componentObj.attempted = false;
            videoComponentLog.push({ ...componentObj });
          } else if (el === 'assignment') {
            additionalObj['Classwork Assignment Exists'] = 'Yes';
            if (userAssignmentRes) {
              additionalObj['Classwork Assignment Visited'] = 'Yes';
              additionalObj['Classwork Assignment Attempted'] = ClassWorkAssignmentCode ? 'Yes' : 'No';
              additionalObj['Classwork Assignment Codes'] = ClassWorkAssignmentCode;
            } else {
              additionalObj['Classwork Assignment Attempted'] = 'No';
            }
          } else if (el === 'homeworkAssignment') {
            additionalObj['Homework Assignment Exists'] = 'Yes';
            if (userAssignmentRes) {
              additionalObj['Homework Assignment Visited'] = 'Yes';
              additionalObj['Homework Assignment Attempted'] = HomeworkAssignmentCode ? 'Yes' : 'No';
              additionalObj['Homework Assignment Codes'] = HomeworkAssignmentCode;
            } else {
              additionalObj['Homework Assignment Visited'] = 'No';
            }
          } else if (el === 'blockBasedPractice') {
            const userBBPracticeCWData = (userBBPracticeCW || []).find((practice) => get(practice, 'blockBasedPractice.id') === get(tc, 'blockBasedProject.id'));
            const index = getUniqueCount(additionalObj, 'Classwork Practice Exists:', 1);
            additionalObj[`Classwork Practice Exists:${index}`] = 'Yes';
            const isAttempted = get(userBBPracticeCWData, 'blockBasedPractice.isSubmitAnswer') ? get(userBBPracticeCWData, 'answerLink') || get(userBBPracticeCWData, 'savedBlocks') : true;
            if (userBBPracticeCWData) {
              additionalObj[`Classwork Practice Visited:${index}`] = 'Yes';
              additionalObj[`Classwork Practice Attempted:${index}`] = !!isAttempted;
              additionalObj[`Classwork Practice Link:${index}`] = get(userBBPracticeCWData, 'answerLink') || '';
            } else {
              additionalObj[`Classwork Practice Visited:${index}`] = 'No';
            }
            componentObj = {
              practiceId: get(tc, 'blockBasedProject.id'),
              visited: !!userBBPracticeCWData,
              attempted: !!isAttempted,
              link: get(userBBPracticeCWData, 'answerLink'),
            };
            classworkPracticeLog.push({ ...componentObj });
          } else if (el === 'homeworkPractice') {
            const userBBPracticeHWData = (userBBPracticeHW || []).find((practice) => get(practice, 'blockBasedPractice.id') === get(tc, 'blockBasedProject.id'));
            const index = getUniqueCount(additionalObj, 'Homework Practice Exists:', 1);
            additionalObj[`Homework Practice Exists:${index}`] = 'Yes';
            const isAttempted = get(userBBPracticeHWData, 'blockBasedPractice.isSubmitAnswer') ? get(userBBPracticeHWData, 'answerLink') || get(userBBPracticeHWData, 'savedBlocks') : true;
            if (userBBPracticeHWData) {
              additionalObj[`Homework Practice Visited:${index}`] = 'Yes';
              additionalObj[`Homework Practice Attempted:${index}`] = !!isAttempted;
              additionalObj[`Homework Practice Link:${index}`] = get(userBBPracticeHWData, 'answerLink') || '';
            } else {
              additionalObj[`Homework Practice Visited:${index}`] = 'No';
            }
            componentObj = {
              practiceId: get(tc, 'blockBasedProject.id'),
              visited: !!userBBPracticeHWData,
              attempted: !!isAttempted,
              link: get(userBBPracticeHWData, 'answerLink'),
            };
            homeworkPracticeLog.push({ ...componentObj });
          } else if (el === 'blockBasedProject') {
            additionalObj['Classwork Project Exists'] = 'Yes';
            if (userBBProjectCW) {
              additionalObj['Classwork Project Visited'] = 'Yes';
              additionalObj['Classwork Project Attempted'] = ClassWorkProjectLink ? 'Yes' : 'No';
              additionalObj['Classwork Project Link'] = ClassWorkProjectLink || '';
            } else {
              additionalObj['Classwork Project Visited'] = 'No';
            }
            componentObj = {
              projectId: get(tc, 'blockBasedProject.id'),
              visited: !!userBBProjectCW,
              attempted: !!ClassWorkProjectLink,
              link: ClassWorkProjectLink || '',
            };
            classworkProjectLog.push({ ...componentObj });
          } else if (el === 'quiz') {
            componentObj = {
              quizReportId: get(quizReport, 'id'),
            };
            additionalObj['Homework Quiz Exists'] = 'Yes';
            if (get(quizReport, 'quizReport.totalQuestionCount')) {
              additionalObj['Homework Quiz Attempted'] = 'Yes';
              additionalObj['Total Quiz Question Count'] = quizReport
                      && quizReport.quizReport
                      && quizReport.quizReport.totalQuestionCount;
              additionalObj['Correct Question Count'] = quizReport
                      && quizReport.quizReport
                      && quizReport.quizReport.correctQuestionCount;
              additionalObj['In Correct Question Count'] = quizReport
                      && quizReport.quizReport
                      && quizReport.quizReport.inCorrectQuestionCount;
              additionalObj['Unanswered Question Count'] = quizReport
                      && quizReport.quizReport
                      && quizReport.quizReport.unansweredQuestionCount;
              additionalObj['Mastery Level'] = quizReport
                      && quizReport.quizReport
                      && quizReport.quizReport.masteryLevel;
            } else {
              additionalObj['Homework Quiz Attempted'] = 'No';
            }
            componentObj = {
              ...componentObj,
              attempted: !!get(quizReport, 'quizReport.totalQuestionCount', false),
              totalQuestionCount: get(quizReport, 'quizReport.totalQuestionCount', 0),
              correctQuestionCount: get(quizReport, 'quizReport.correctQuestionCount', 0),
              inCorrectQuestionCount: get(quizReport, 'quizReport.inCorrectQuestionCount', 0),
              unansweredQuestionCount: get(quizReport, 'quizReport.unansweredQuestionCount', 0),
              masteryLevel: get(quizReport, 'quizReport.masteryLevel') || '',
            };
            componentObj.questions = [];
            get(quizReport, 'quizAnswers', []).forEach((answer) => {
              componentObj.questions.push({
                questionId: get(answer, 'question.id'),
                isAttempted: get(answer, 'isAttempted', false),
                isCorrect: get(answer, 'isCorrect'),
              });
            });
            homeworkQuizLog.push({ ...componentObj });
          } else if ((el === 'learningObjective')) {
            const userLoRes = userLos.find((lo) => get(lo, 'learningObjective.id') === get(tc, 'learningObjective.id'));
            const pqReportRes = pqReports.find((pq) => get(pq, 'learningObjective.id') === get(tc, 'learningObjective.id'));
            const loComponentLog = {
              loId: get(tc, 'learningObjective.id'),
            };
            additionalObj['PQ Exists'] = 'Yes';
            if (userLoRes) {
              additionalObj['PQ Visited'] = 'Yes';
              loComponentLog.visited = true;
            }
            if (pqReportRes) {
              additionalObj['PQ Attempted'] = 'Yes';
              loComponentLog.attempted = true;
            }

            const fIndex = getUniqueCount(additionalObj, 'PQ FirstTryCount:', 1);
            const sIndex = getUniqueCount(additionalObj, 'PQ SecondTryCount:', 1);
            const tIndex = getUniqueCount(additionalObj, 'PQ ThirdTryCount:', 1);

            const thirdOrMoreTryCount = get(pqReportRes, 'detailedReport', []).length - (get(pqReportRes, 'firstTryCount', 0) + get(pqReportRes, 'secondTryCount', 0));
            additionalObj[`PQ FirstTryCount:${fIndex}`] = pqReportRes && pqReportRes.firstTryCount;
            additionalObj[`PQ SecondTryCount:${sIndex}`] = pqReportRes && pqReportRes.secondTryCount;
            additionalObj[`PQ ThirdTryCount:${tIndex}`] = thirdOrMoreTryCount || 0;

            firstTryCount += (pqReportRes && pqReportRes.firstTryCount) || 0;
            secondTryCount += (pqReportRes && pqReportRes.secondTryCount) || 0;
            threeOrMoreTryCount += thirdOrMoreTryCount || 0;
            loComponentLog.firstTryCount = firstTryCount;
            loComponentLog.secondTryCount = secondTryCount;
            loComponentLog.threeOrMoreTryCount = threeOrMoreTryCount;
            loComponentLog.questions = [];
            get(userLoRes, 'practiceQuestions', []).forEach((pqReport) => {
              const report = get(pqReportRes, 'detailedReport', []).find((reportData) => get(reportData, 'question.id') === get(pqReport, 'question.id'));
              let reportObj = { questionId: get(pqReport, 'question.id') };
              reportObj = {
                ...reportObj,
                attempted: !!report,
                firstTry: get(report, 'firstTry', false),
                secondTry: get(report, 'secondTry', false),
                thirdOrMoreTry: get(report, 'thirdOrMoreTry', false),
              };
              loComponentLog.questions.push(reportObj);
            });
            totalCount += get(userLoRes, 'practiceQuestions', []).length;
            pqComponentLog.push({ ...loComponentLog });
          }
        });
    }

    const classworkScore = totalCount !== 0 ? ((
      ((firstTryCount * 10) + (secondTryCount * 8) + (threeOrMoreTryCount * 6)) / (totalCount * 10)
    ) * 100) : 0;

    const homeworkScore = get(quizReport, 'quizReport.totalQuestionCount', 0) !== 0 ? ((get(quizReport, 'quizReport.correctQuestionCount', 0) / get(quizReport, 'quizReport.totalQuestionCount', 0)) * 100) : 0;
    const proficiency = Number(((0.5 * (classworkScore || 0)) + (0.5 * (homeworkScore || 0))).toFixed(0));
    obj = {
      ...obj,
      classworkVisited: (totalClassworkCount !== 0 && classworkCompletionCount !== 0) ? Number(((classworkCompletionCount / totalClassworkCount) * 100).toFixed(0)) : 0,
      classworkAttempted: (totalClassworkCount !== 0 && classworkAttemptedCount !== 0) ? Number(((classworkAttemptedCount / totalClassworkCount) * 100).toFixed(0)) : 0,
      homeworkVisited: (totalHomeworkCount !== 0 && homeworkCompletionCount !== 0) ? Number(((homeworkCompletionCount / totalHomeworkCount) * 100).toFixed(0)) : 0,
      homeworkAttempted: (totalHomeworkCount !== 0 && homeworkAttemptedCount !== 0) ? Number(((homeworkAttemptedCount / totalHomeworkCount) * 100).toFixed(0)) : 0,
      classworkScore: classworkScore ? Number(classworkScore.toFixed(0)) : 0,
      homeworkScore: homeworkScore ? Number(homeworkScore.toFixed(0)) : 0,
      proficiency,
      homeworkExists: !!totalHomeworkCount,
      videoComponentLog,
      pqComponentLog,
      classworkAssignmentLog,
      homeworkAssignmentLog,
      classworkPracticeLog,
      homeworkPracticeLog,
      classworkProjectLog,
      homeworkQuizLog,
      ...additionalObj,
    };
    return obj;
  }
  return {};
};

const runScriptForSchoolReport = async (root, params, context) => {
  validateAuthentication(context);
  const reportFor = get(params, 'reportFor', []);
  const schoolIds = get(params, 'schoolIds');
  let sessionStatusString = '';
  const sessionStatus = get(params, 'sessionStatus', []);
  sessionStatus.forEach((status, ind) => {
    sessionStatusString += (ind === sessionStatus.length - 1) ? `${status}` : `${status},`;
  });
  sessionStatusString = sessionStatusString ? `[${sessionStatusString}]` : '';
  const userSessionReportController = new MasterController('UserLevelSessionReport', { bypass: true });
  // const grades = get(params, 'grades');
  // const sections = get(params, 'sections');
  const sheetId = get(params, 'sheetId');
  // eslint-disable-next-line camelcase
  let new_array = [];

  const mentorMenteeSessionsQuery = (userId, topicId, userIdsString) => `
  query{
    mentorMenteeSessions(filter: {and: [
      {topic_some: {id: "${topicId}"}}, 
      {menteeSession_some: {
        ${userId ? `user_some: {id: "${userId}"}` : ''}
        ${(userIdsString) ? `user_some:{id_in:[${userIdsString}]}` : ''}
        }
      } 
    ]}) {
      id
      rating
      isQuizSubmitted
      isAssignmentSubmitted
      startSessionByMentee
      endSessionByMentee
      menteeSession {
        user {
          id
        }
      }
    }
  }
  `;

  const quizReportQuery = (userId, topicId, userIdsString) => `
  query{
    userQuizReports(filter: {and: [
      {topic_some: {id : "${topicId}"}}, 
      {${userId ? `user_some: {id: "${userId}"}` : ''}
        ${(userIdsString) ? `user_some:{id_in:[${userIdsString}]}` : ''}}
    ]}, orderBy: createdAt_DESC) {
      id
      user {
        id
      }
      quizAnswers{
        question{
          id
        }
        isAttempted
        isCorrect
      }
      quizReport {
        totalQuestionCount
        correctQuestionCount
        inCorrectQuestionCount
        unansweredQuestionCount
        masteryLevel
      }
    }
  }
  `;
  // school_some:{id: "cl3dbyfye000s0u5fb1knb9r2"}
  const batchSessionsQuery = `
    query{
      batchSessions(filter: {
        and: [
          ${sessionStatusString ? `{sessionStatus_in:${sessionStatusString}}` : ''},
          {topic_some:{classType: lab}}
          {
            batch_some: {
              and: [
                {
                  documentType: classroom
                }
                ${(schoolIds && schoolIds.length) ? `{
                  school_some:{id_in: [${getIdArrForQuery(schoolIds)}]}
                }` : ''}
              ]
            }
          }
      ]
    }) {
        id
        sessionStartDate
        sessionStatus
        bookingDate
        sessionEndDate
        createdAt
        updatedAt
        topic {
          id
          title
          order
          classType
          courses {
            title
            id
            category
          }
          topicComponentRule {
            componentName
            learningObjective {
              id
            }
            video {
              id
            }
            blockBasedProject {
              id
            }
          }
        }
        mentorSession{
          user{
            id
            name
          }
        }
        attendance{
          status
          student{
            id
            grade
            section
            schoolClass{
              grade
              section
            }
            user{
              id
              name
            }
            parents{
              user{
                name
                email
                phone{
                  number
                }
              }
            }
          }
        }
        batch {
          id
          code
          classroomTitle
          classes {
            grade
            section 
          }
          allottedMentor {
            id
            username
            name
            email
            mentorProfile {
              studentProfile {
                user {
                  id
                }
              }
            }
          }
          school{
            id
            name
          }
        }
      }
    }
  `;

  const pqReportQuery = (userId, topicId, userIdsString, loIds) => `
  query{
    userPracticeQuestionReports(filter:{
      and:[
        {
          learningObjective_some: { 
            or: [
              { id_in: [${getIdArrForQuery(loIds)}] }
              {
                topic_some:{
                  id:"${topicId}"
                }
              }
            ]
          }     
        }
        {
          ${userId ? `user_some: {id: "${userId}"}` : ''}
          ${userIdsString ? `user_some:{id_in:[${userIdsString}]}` : ''}
        }
      ]
    }){
      id
      firstTryCount
      secondTryCount
      threeOrMoreTryCount
      detailedReport {
        firstTry
        secondTry
        thirdOrMoreTry
        question{
          id
        }
      }
      learningObjective {
        id
      }
      user {
        id
      }
    }
  }
  `;

  const loQuery = (topicId, userIdsString, loIds) => `
  query{
    userLearningObjectives(filter:{
      and:[
        {
          learningObjective_some: { 
            or: [
              { id_in: [${getIdArrForQuery(loIds)}] }
              {
                topic_some:{
                  id:"${topicId}"
                }
              }
            ]
          }     
        }
        {
          ${userIdsString ? `user_some:{id_in:[${userIdsString}]}` : ''}
        }
      ]
    }){
      id
      learningObjective {
        id
      }
      user {
        id
      }
      practiceQuestions{
        status
        question{
          id
        }
      }
    }
  }
  `;

  const userAssignmentQuery = (userId, topicId, userIdsString) => `
  query{
    userAssignments(filter:{
      and: [
        {
          topic_some:{
            id: "${topicId}"
          }
        }
        {
          ${userId ? `user_some: {id: "${userId}"}` : ''}
          ${(userIdsString) ? `user_some:{id_in:[${userIdsString}]}` : ''}
        }
      ]
    }){
      id
      user {
        id
      }
      assignment {
        assignmentQuestion {
          isHomework
          id
        }
        userAnswerCodeSnippet
      }
    }
  }
  `;
  const userBBPracticeClassWorkQuery = (userId, topicId, userIdsString) => `
  query{
    userBlockBasedPractices(filter:{
      and: [
        {
          topic_some:{
            id: "${topicId}"
          }
        }
        {
          blockBasedPractice_some:{
            isHomework_not: true
          }
        }
        {
          ${userId ? `user_some: {id: "${userId}"}` : ''}
          ${userIdsString ? `user_some:{id_in:[${userIdsString}]}` : ''}
        }
      ]
    }){
      id
      blockBasedPractice {
        id
        isSubmitAnswer
        isHomework
      }
      answerLink
      savedBlocks
      user {
        id
      }
    }
  }
  `;
  const userBBPracticeHomeworkQuery = (userId, topicId, userIdsString) => `
  query{
    userBlockBasedPractices(filter:{
      and: [
        {
          blockBasedPractice_some:{
            isHomework: true
          }
        }
        {
          topic_some:{
            id: "${topicId}"
          }
        }
        {
           ${userId ? `user_some: {id: "${userId}"}` : ''}
          ${userIdsString ? `user_some:{id_in:[${userIdsString}]}` : ''}
        }
      ]
    }){
      id
      blockBasedPractice {
        id
        isSubmitAnswer
        isHomework
      }
      answerLink
      savedBlocks
      user {
        id
      }
    }
  }
  `;
  const userBBProjectQuery = (userId, topicId, userIdsString) => `
  query{
    userActivityBlockBasedProjectDumps(filter:{
      and: [
        {
          topic_some:{
            id: "${topicId}"
          }
        }
        {
           ${userId ? `user_some: {id: "${userId}"}` : ''}
          ${(userIdsString) ? `user_some:{id_in:[${userIdsString}]}` : ''}
        }
      ]
    }){
      id
      user {
        id
      }
      savedBlocks
      answerLink
    }
  }
  `;
  const userVideoQuery = (userId, topicId, userIdsString) => `
    query{
      userVideos(filter:{
        and: [
          {
            topic_some:{
              id: "${topicId}"
            }
          }
          {
            ${userId ? `user_some: {id: "${userId}"}` : ''}
            ${(userIdsString) ? `user_some:{id_in:[${userIdsString}]}` : ''}
          }
        ]
      }){
        id
        user {
          id
        }
      }
    }
  `;

  console.log('----------------------herererere---------------');
  const mentorMenteeSessionsRes = await callLocalGraphqlApi(
    batchSessionsQuery,
    context,
  );
  const mentorMenteeSessions = get(
    mentorMenteeSessionsRes,
    'data.batchSessions',
    [],
  );
  console.log(
    '----------------------length---------------',
    mentorMenteeSessions.length,
  );
  let obj = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const elem of mentorMenteeSessions) {
    console.log(
      '----------------------batchSession---------------',
      elem && elem.topic && elem.topic.title,
    );
    console.log(
      'Status -> ',
      elem && elem.sessionStatus,
    );

    const student_present_count = 0;
    const sessionStartDate = new Date(get(elem, 'sessionStartDate'));
    const sessionEndDate = new Date(get(elem, 'sessionEndDate'));

    const sessionDurationInHr = (get(elem, 'sessionStartDate') && get(elem, 'sessionEndDate')) ? Math.abs(sessionStartDate.getTime() - sessionEndDate.getTime()) / 1000 : 0;
    let sessinBookingDate = '';
    if (elem.bookingDate) {
      sessinBookingDate = new Date(elem.bookingDate);
      sessinBookingDate.setHours(sessinBookingDate.getHours() + 5);
      sessinBookingDate.setMinutes(sessinBookingDate.getMinutes() + 30);
    }
    const topicId = elem && elem.topic && elem.topic.id;
    for (const role of reportFor) {
      const isTeacherReportFlow = role === 'teacher';
      if (elem && elem.attendance && elem.attendance.length && topicId) {
        let userIds = elem.attendance.map((e) => get(e, 'student.user.id'));
        if (isTeacherReportFlow) userIds = [get(elem, 'batch.allottedMentor.mentorProfile.studentProfile.user.id')];

        const userIdsString = getIdArrForQuery(userIds);
        // eslint-disable-next-line no-await-in-loop
        const allStudentsMmsRes = await callLocalGraphqlApi(
          mentorMenteeSessionsQuery(null, topicId, userIdsString),
        );
        const allMentorMenteeSessions = get(
          allStudentsMmsRes,
          'data.mentorMenteeSessions',
          {},
        );

        // eslint-disable-next-line no-await-in-loop
        const allVideosRes = await callLocalGraphqlApi(
          userVideoQuery(null, topicId, userIdsString),
        );
        const allUserVideos = get(allVideosRes, 'data.userVideos', []);

        // eslint-disable-next-line no-await-in-loop
        const allQuizRes = await callLocalGraphqlApi(
          quizReportQuery(null, topicId, userIdsString),
        );
        const allQuizReportRes = get(allQuizRes, 'data.userQuizReports', []);

        const loComps = get(elem, 'topic.topicComponentRule', []).filter((el) => get(el, 'componentName') === 'learningObjective');
        const loIds = loComps.map((el) => get(el, 'learningObjective.id'));
        // eslint-disable-next-line no-await-in-loop
        const allPqRes = await callLocalGraphqlApi(
          pqReportQuery(null, topicId, userIdsString, loIds),
        );
        const allPqReport = get(
          allPqRes,
          'data.userPracticeQuestionReports',
          [],
        );

        // eslint-disable-next-line no-await-in-loop
        const allLoRes = await callLocalGraphqlApi(
          loQuery(topicId, userIdsString, loIds),
        );
        const allLos = get(
          allLoRes,
          'data.userLearningObjectives',
          [],
        );

        // eslint-disable-next-line no-await-in-loop
        const allUserAssignmentRes = await callLocalGraphqlApi(
          userAssignmentQuery(null, topicId, userIdsString),
        );
        const allUserAssignments = get(
          allUserAssignmentRes,
          'data.userAssignments',
        );
          // // eslint-disable-next-line no-await-in-loop
          // const allUserAssignmentHWRes = await callLocalGraphqlApi(
          //   userAssignmentHWQuery(null, topicId, userIdsString),
          // );
          // const allUserAssignmentHWData = get(
          //   allUserAssignmentHWRes,
          //   'data.userActivityAssignmentDumps',
          // );
          // eslint-disable-next-line no-await-in-loop
        const allUserBBPractices = await callLocalGraphqlApi(
          userBBPracticeClassWorkQuery(null, topicId, userIdsString),
        );
        const allUserBBPracticeCWs = get(
          allUserBBPractices,
          'data.userBlockBasedPractices',
        );
          // eslint-disable-next-line no-await-in-loop
        const allUserBBPracticeHW = await callLocalGraphqlApi(
          userBBPracticeHomeworkQuery(null, topicId, userIdsString),
        );
        const allUserBBPracticeHWs = get(
          allUserBBPracticeHW,
          'data.userActivityBlockBasedPracticeDumps',
        );
          // eslint-disable-next-line no-await-in-loop
        const allUserBBProjectCWRes = await callLocalGraphqlApi(
          userBBProjectQuery(null, topicId, userIdsString),
        );
        const allUserBBProjectCWs = get(
          allUserBBProjectCWRes,
          'data.userActivityBlockBasedProjectDumps',
        );
          // eslint-disable-next-line no-loop-func
        if (!isTeacherReportFlow) {
          // eslint-disable-next-line no-restricted-syntax
          for (const student of elem.attendance) {
            const userId = student
                && student.student
                && student.student.user
                && student.student.user.id;
            if (userId) {
              obj = getReportObj({
                userId,
                isTeacherReportFlow,
                allMentorMenteeSessions,
                allQuizReportRes,
                allPqReport,
                allUserAssignments,
                allUserBBPracticeCWs,
                allUserBBPracticeHWs,
                allUserBBProjectCWs,
                allUserVideos,
                allLos,
                elem,
                student,
                sessionDetail: {
                  sessionStartDate,
                  sessionDurationInHr,
                  sessionEndDate,
                },
              });
              obj.sessionCreationDate = get(elem, 'createdAt');
              obj.sessionUpdationAt = get(elem, 'updatedAt');
              if (obj && obj.userId) {
                const {
                  schoolId, classroomId, sessionId,
                  topicId: topicDataId,
                } = obj;
                const userSessionReport = await userSessionReportController.Model.findAll({
                  where: {
                    userId: obj.userId, schoolId, classroomId, sessionId, topicId: topicDataId,
                  },
                });
                if (userSessionReport && userSessionReport.length) {
                  const docId = get(userSessionReport, '[0].id');
                  const updatedObj = { id: docId, ...obj };
                  await userSessionReportController.Model.update(updatedObj, { where: { id: docId } });
                } else {
                  obj.id = cuid();
                  await userSessionReportController.Model.create({ ...obj });
                }
              }
              new_array.push(obj);
            }
            obj = {};
          }
        } else {
          const userId = get(elem, 'batch.allottedMentor.mentorProfile.studentProfile.user.id');
          obj = getReportObj({
            userId,
            isTeacherReportFlow,
            allMentorMenteeSessions,
            allQuizReportRes,
            allPqReport,
            allUserAssignments,
            allUserBBPracticeCWs,
            allUserBBPracticeHWs,
            allUserBBProjectCWs,
            allUserVideos,
            allLos,
            elem,
            sessionDetail: {
              sessionStartDate,
              sessionDurationInHr,
              sessionEndDate,
            },
          });
          obj.sessionCreationDate = get(elem, 'createdAt');
          obj.sessionUpdationAt = get(elem, 'updatedAt');
          if (obj && obj.userId) {
            const {
              schoolId, classroomId, sessionId,
              topicId: topicDataId,
            } = obj;
            const userSessionReport = await userSessionReportController.Model.findAll({
              where: {
                userId: obj.userId, schoolId, classroomId, sessionId, topicId: topicDataId,
              },
            });
            if (userSessionReport && userSessionReport.length) {
              const docId = get(userSessionReport, '[0].id');
              const updatedObj = { id: docId, ...obj };
              await userSessionReportController.Model.update(updatedObj, { where: { id: docId } });
            } else {
              obj.id = cuid();
              await userSessionReportController.Model.create({ ...obj });
            }
          }
          new_array.push(obj);
          obj = {};
        }
      }
    }
  }

  new_array = new_array.map((arr) => {
    const updatedObj = {};
    const initialObj = arr;
    defaultColumns.forEach((col) => {
      updatedObj[col] = initialObj[col] || ' ';
      delete initialObj[col];
    });
    return {
      ...updatedObj,
      ...initialObj,
    };
  });
  if (sheetId) {
    updateSheet(new_array, sheetId);
  } else console.log('=================DONE====================');
  // console.log('--------------------new_array', JSON.stringify(new_array));
  // console.log('--------------------new_array', new_array.length);

  return {
    payload: JSON.stringify(new_array),
  };
};

export default runScriptForSchoolReport;

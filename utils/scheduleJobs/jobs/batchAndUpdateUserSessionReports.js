import { get, sortBy } from 'lodash';
import { AggregationBuilder } from 'mongodb-aggregation-builder';
import { ConditionPayload, EqualityPayload } from 'mongodb-aggregation-builder/helpers';
import { ArrayElemAt } from 'mongodb-aggregation-builder/operators';
import Sequelize from 'sequelize';
import { topicComponents } from '../../../constants';
import { QueryController } from '../../../src/autoGenerate/graphql/controllers';
import MasterController from '../../../src/autoGenerate/graphql/controllers/MasterController';
import { log } from '../../log';

const SequelizeOperation = Sequelize.Op;

const sqlColumnsToUpdate = ['studentId', 'studentName', 'userRole', 'studentGrade', 'studentSection', 'classroomId', 'classroomTitle', 'classroomStudentsCount', 'schoolId', 'schoolName', 'topicId', 'sessionId', 'sessionTitle', 'sessionType', 'courseId', 'courseTitle', 'courseCategory', 'sessionStart', 'sessionEnd', 'sessionDuration', 'sessionStatus', 'studentAttendance', 'sessionCreationDate', 'sessionUpdationAt', 'teacherName', 'teacherId', 'sessionClassworkComponents', 'sessionHomeworkComponents', 'previousLogs', 'classworkVisited', 'classworkAttempted', 'homeworkVisited', 'homeworkAttempted', 'classworkScore', 'homeworkScore', 'proficiency', 'homeworkExists', 'videoComponentLog', 'pqComponentLog', 'classworkAssignmentLog', 'homeworkAssignmentLog', 'classworkPracticeLog', 'homeworkPracticeLog', 'homeworkQuizLog'];

const getBatchedUserSessionDump = (userSessionDumps) => {
  const batchedUserSessionDump = {};
  const documentIdsToFetch = {
    classroomIds: new Set(),
    topicIds: new Set(),
    userIds: new Set(),
    batchSessionFilters: {},
  };
  if (userSessionDumps && userSessionDumps.length) {
    userSessionDumps.forEach((userSessionDump) => {
      const {
        classroomId,
        topicId,
        userId,
        componentId,
      } = userSessionDump;

      if (classroomId && topicId && userId && componentId) {
        // Adding Ids to Set to fetch from mongo
        documentIdsToFetch.classroomIds.add(classroomId);
        documentIdsToFetch.topicIds.add(topicId);
        documentIdsToFetch.userIds.add(userId);
        // Compiling filters object to fetch batch session details
        if (!documentIdsToFetch.batchSessionFilters[`${classroomId}-${topicId}`]) {
          documentIdsToFetch.batchSessionFilters[`${classroomId}-${topicId}`] = {
            'batch.typeId': classroomId,
            'topic.typeId': topicId,
          };
        }

        // Combining classroomId, topicId and user Id to make unique key
        const uniqueSessionRowKey = `${classroomId}-${topicId}-${userId}`;
        if (!batchedUserSessionDump[uniqueSessionRowKey]) {
          batchedUserSessionDump[uniqueSessionRowKey] = [];
        }
        batchedUserSessionDump[uniqueSessionRowKey].push(userSessionDump);
      }
    });
  }
  return {
    batchedUserSessionDump,
    documentIdsToFetch,
  };
};

const getDatabaseControllers = () => {
  const authentication = { bypass: true };
  const userSessionDumpController = new MasterController('UserSessionDump', authentication);

  const batchSessionController = new QueryController('BatchSession', authentication);

  const topicController = new QueryController('Topic', authentication);

  const userController = new QueryController('User', { bypass: true });

  const userSessionReportController = new MasterController('UserSessionReport', {
    bypass: true,
  });

  return {
    userSessionDumpController,
    batchSessionController,
    topicController,
    userController,
    userSessionReportController,
  };
};

const getAggregationQueries = (documentIdsToFetch) => {
  const batchSessionAggregationQuery = new AggregationBuilder('BatchSession')
    .Match({ $or: Object.values(documentIdsToFetch.batchSessionFilters) })
    .Project({
      id: 1, course: 1, batch: 1, topic: 1, sessionStartDate: 1, sessionEndDate: 1, sessionStatus: 1, attendance: 1, createdAt: 1, updatedAt: 1,
    })
    .Lookup(EqualityPayload('Topic', 'topic', 'topic.typeId', 'id'))
    .Lookup(EqualityPayload('Course', 'course', 'course.typeId', 'id'))
    .Lookup(ConditionPayload('Batch', 'batch',
      {
        variableList: [{
          var: 'batchId',
          source: 'batch.typeId',
          key: 'primary',
        }],
        nestedAggregation: new AggregationBuilder('Batch')
          .Lookup(EqualityPayload('School', 'school', 'school.typeId', 'id'))
          .Lookup(EqualityPayload('User', 'allottedMentor', 'allottedMentor.typeId', 'id'))
          .Project({
            id: 1, classroomTitle: 1, code: 1, school: ArrayElemAt('$school', 0), allottedMentor: ArrayElemAt('$allottedMentor', 0), createdAt: 1, updatedAt: 1,
          }),
      }))
    .Project({
      id: 1,
      sessionStartDate: 1,
      sessionEndDate: 1,
      sessionStatus: 1,
      attendance: 1,
      createdAt: 1,
      updatedAt: 1,
      course: ArrayElemAt('$course', 0),
      batch: ArrayElemAt('$batch', 0),
      topic: ArrayElemAt('$topic', 0),
    })
    .getPipeline();

  const topicAggregationQuery = new AggregationBuilder('Topic')
    .Match({ id: { $in: Array.from(documentIdsToFetch.topicIds) } })
    .getPipeline();

  const userAggregationQuery = new AggregationBuilder('User')
    .Match({ id: { $in: Array.from(documentIdsToFetch.userIds) } })
    .Lookup(EqualityPayload('StudentProfile', 'studentProfile', 'studentProfile.typeId', 'id'))
    .Project({
      id: 1,
      name: 1,
      studentProfile: ArrayElemAt('$studentProfile', 0),
    })
    .getPipeline();

  return {
    batchSessionAggregationQuery,
    userAggregationQuery,
    topicAggregationQuery,
  };
};

const getAllRequiredDataFromDatabase = async () => {
  // Get all required controllers
  const {
    userSessionDumpController,
    batchSessionController,
    topicController,
    userController,
    userSessionReportController,
  } = getDatabaseControllers();

  // Fetching All Dumps From Postgres.
  const userSessionDumps = await userSessionDumpController.Model.findAll({ raw: true });

  // Batch User Session Dumps based on Classroom, Topic and UserId
  const {
    batchedUserSessionDump,
    documentIdsToFetch,
  } = getBatchedUserSessionDump(userSessionDumps);

  const {
    batchSessionAggregationQuery,
    userAggregationQuery,
    topicAggregationQuery,
  } = getAggregationQueries(documentIdsToFetch);

  // Fetching BatchSession and User Data from mongo.
  const batchSessions = await batchSessionController.aggregate(batchSessionAggregationQuery);
  const topics = await topicController.aggregate(topicAggregationQuery);
  const users = await userController.aggregate(userAggregationQuery);

  // Creating Filter Array for fetching UserSessionReport
  const sessionReportFilterArray = Object.keys(batchedUserSessionDump).map((uniqueSessionRowKey) => {
    const sessionRowSplitArray = uniqueSessionRowKey.split('-');
    return {
      [SequelizeOperation.and]: [
        { classroomId: sessionRowSplitArray[0] },
        { topicId: sessionRowSplitArray[1] },
        { studentId: sessionRowSplitArray[2] },
      ],
    };
  });

  // Fetch Existing UserSessionReport from Postgres
  const userSessionReports = await userSessionReportController.Model.findAll({
    where: { [SequelizeOperation.or]: sessionReportFilterArray },
    raw: true,
  });

  return {
    batchSessions,
    users,
    topics,
    userSessionDumps,
    userSessionReports,
    batchedUserSessionDump,
    topicAggregationQuery,
    userSessionDumpController,
    userSessionReportController,
  };
};

const getBaseDocumentAndCalculatedFields = ({
  classroomId, studentId, topicId, userSessionReports, topicDoc, batchSessions, users,
}) => {
  // Check if userSessionReport already exists
  const existingSessionReport = userSessionReports.find((report) => (
    (report.topicId === topicId)
      && (report.studentId === studentId)
      && (report.classroomId === classroomId)
  ));

  // Get User Details
  const userDetails = (users || []).find((user) => (user.id === studentId));

  // Get Session Details
  const sessionDetails = (batchSessions || []).find(
    (session) => (
      (get(session, 'batch.id') === classroomId)
        && (get(session, 'topic.id') === topicId)),
  );

  // Check if student is present in the session
  const studentAttendanceDoc = get(sessionDetails, 'attendance', []).find((attendance) => (get(attendance, 'student.typeId') === get(userDetails, 'studentProfile.id')));
  const studentAttendance = get(studentAttendanceDoc, 'status') === 'present';

  // Calculate Session Duration
  const sessionStartDate = new Date(get(sessionDetails, 'sessionStartDate'));
  const sessionEndDate = new Date(get(sessionDetails, 'sessionEndDate'));

  const sessionDuration = (get(sessionDetails, 'sessionStartDate') && get(sessionDetails, 'sessionEndDate')) ? Math.abs(sessionStartDate.getTime() - sessionEndDate.getTime()) / 1000 : 0;

  const userRole = get(userDetails, 'studentProfile.mentor.typeId') ? 'Teacher' : 'Student';

  const sessionComponentRule = get(topicDoc, 'topicComponentRule') || get(sessionDetails, 'topic.topicComponentRule') || [];
  const sessionClassworkComponents = sessionComponentRule.filter((component) => !['homeworkAssignment', 'quiz', 'homeworkPractice'].includes(component.componentName));
  const sessionHomeworkComponents = sessionComponentRule.filter((component) => ['homeworkAssignment', 'quiz', 'homeworkPractice'].includes(component.componentName));

  const baseDocument = {
    studentId,
    studentName: get(userDetails, 'name', ''),
    userRole,
    studentGrade: get(userDetails, 'studentProfile.grade', ''),
    studentSection: get(userDetails, 'studentProfile.section', ''),
    classroomId,
    classroomTitle: get(sessionDetails, 'batch.classroomTitle'),
    classroomStudentsCount: get(sessionDetails, 'attendance', []).length,
    schoolId: get(sessionDetails, 'batch.school.id'),
    schoolName: get(sessionDetails, 'batch.school.name'),
    topicId,
    sessionId: get(sessionDetails, 'id'),
    sessionTitle: get(topicDoc, 'title') || get(sessionDetails, 'topic.title'),
    sessionType: get(topicDoc, 'classType') || get(sessionDetails, 'topic.classType'),
    courseId: get(topicDoc, 'courses[0].id') || get(sessionDetails, 'course.id'),
    courseTitle: get(topicDoc, 'courses[0].title') || get(sessionDetails, 'course.title'),
    courseCategory: get(topicDoc, 'courses[0].category') || get(sessionDetails, 'course.category'),
    sessionStart: get(sessionDetails, 'sessionStartDate'),
    sessionEnd: get(sessionDetails, 'sessionEndDate'),
    sessionDuration,
    sessionStatus: get(sessionDetails, 'sessionStatus'),
    studentAttendance,
    sessionCreationDate: get(sessionDetails, 'createdAt'),
    sessionUpdationAt: get(sessionDetails, 'updatedAt'),
    teacherName: get(sessionDetails, 'batch.allottedMentor.name'),
    teacherId: get(sessionDetails, 'batch.allottedMentor.id'),
    sessionClassworkComponents,
    sessionHomeworkComponents,
  };

  // If userSessionReport already exists, then use the id from it.
  if (existingSessionReport && get(existingSessionReport, 'id')) {
    baseDocument.id = get(existingSessionReport, 'id');
    baseDocument.previousLogs = [...(get(existingSessionReport, 'previousLogs') || []), existingSessionReport];
  }

  // Assigning Existing Report Values Or Default Values.
  const calculatedFields = {
    classworkVisited: get(existingSessionReport, 'classworkVisited', 0),
    classworkAttempted: get(existingSessionReport, 'classworkAttempted', 0),
    homeworkVisited: get(existingSessionReport, 'homeworkVisited', 0),
    homeworkAttempted: get(existingSessionReport, 'homeworkAttempted', 0),
    classworkScore: get(existingSessionReport, 'classworkScore', 0),
    homeworkScore: get(existingSessionReport, 'homeworkScore', 0),
    proficiency: get(existingSessionReport, 'proficiency', 0),
    homeworkExists: get(existingSessionReport, 'homeworkExists', false),
    videoComponentLog: get(existingSessionReport, 'videoComponentLog', []),
    pqComponentLog: get(existingSessionReport, 'pqComponentLog', []),
    classworkAssignmentLog: get(existingSessionReport, 'classworkAssignmentLog', []),
    homeworkAssignmentLog: get(existingSessionReport, 'homeworkAssignmentLog', []),
    classworkPracticeLog: get(existingSessionReport, 'classworkPracticeLog', []),
    homeworkPracticeLog: get(existingSessionReport, 'homeworkPracticeLog', []),
    homeworkQuizLog: get(existingSessionReport, 'homeworkQuizLog', []),
  };

  return {
    baseDocument,
    calculatedFields,
    userDetails,
    sessionDetails,
    existingSessionReport,
  };
};

const transformPreviousReportDumpsIfRequired = (previousDumps = [], componentName) => {
  if (previousDumps.length) {
    return previousDumps.map((dump) => {
      if (!get(dump, 'id')) {
        const transformedDump = {
          id: `transformed-${componentName}`,
          componentType: componentName,
          eventType: 'update',
          recordRawDump: [dump],
        };
        switch (componentName) {
          case topicComponents.video: {
            transformedDump.componentId = get(dump, 'videoId');
            break;
          }
          case topicComponents.homeworkAssignment: {
            transformedDump.recordRawDump = [{
              ...dump,
              isHomework: true,
            }];
            break;
          }
          case topicComponents.homeworkPractice:
          case topicComponents.blockBasedPractice: {
            transformedDump.componentId = get(dump, 'practiceId');
            break;
          }
          case topicComponents.learningObjective: {
            transformedDump.componentId = get(dump, 'loId');
            break;
          }
          default:
            break;
        }
        return transformedDump;
      }
      return dump;
    });
  }
  return previousDumps;
};

const getCombinedAndSortedDumps = (latestDumps = [], previousDumps = [], componentName) => {
  const transformedPreviousDumps = transformPreviousReportDumpsIfRequired(previousDumps, componentName);
  const combinedComponentLogs = [...latestDumps, ...transformedPreviousDumps];
  const sortedComponentDumps = sortBy(combinedComponentLogs, ['mongoDocCreatedAt']);
  return sortedComponentDumps;
};

const filterDuplicateComponentDumps = (componentDumps) => {
  if (componentDumps && componentDumps.length) {
    return componentDumps.filter((doc, index, self) => (doc.id && self.findIndex((o) => o.id === doc.id) === index));
  }
  return [];
};

const calculateFieldsBasedOnComponentType = (componentName, calculatedFields, filteredComponentDumps, componentRule, componentCountsMeta) => {
  const componentCounts = componentCountsMeta;
  const userSessionProgress = calculatedFields;
  switch (componentName) {
    case topicComponents.video: {
      componentCounts.totalClassworkCount += 1;

      const sortedComponentDumps = getCombinedAndSortedDumps(filteredComponentDumps, get(calculatedFields, 'videoComponentLog', []), componentName);
      const filteredVideoDumps = sortedComponentDumps.filter((doc) => (doc.componentId === get(componentRule, 'video.typeId')));
      if (filteredVideoDumps && filteredVideoDumps.length) {
        const latestComponentDump = filteredVideoDumps[filteredVideoDumps.length - 1];
        if (get(latestComponentDump, 'id')) {
          userSessionProgress.videoComponentLog.push(...(filteredVideoDumps || []));
          componentCounts.totalClassworkVisitedCount += 1;
          componentCounts.totalClassworkAttemptedCount += 1;
        }

        userSessionProgress.videoComponentLog = filterDuplicateComponentDumps(userSessionProgress.videoComponentLog);
      }
      break;
    }
    case topicComponents.assignment:
    case topicComponents.homeworkAssignment: {
      const isHomework = componentName !== topicComponents.assignment;
      if (isHomework) {
        componentCounts.totalHomeworkCount += 1;
        userSessionProgress.homeworkExists = true;
      } else { componentCounts.totalClassworkCount += 1; }

      let sortedComponentDumps = getCombinedAndSortedDumps(filteredComponentDumps, get(calculatedFields, 'classworkAssigmentLog', []), componentName);
      if (isHomework) sortedComponentDumps = getCombinedAndSortedDumps(filteredComponentDumps, get(calculatedFields, 'homeworkAssignmentLog', []), componentName);

      if (sortedComponentDumps && sortedComponentDumps.length) {
        if (isHomework) componentCounts.totalHomeworkVisitedCount += 1;
        else componentCounts.totalClassworkVisitedCount += 1;

        const studentAttemptedLogs = sortedComponentDumps.filter((doc) => (doc.eventType === 'update'));
        if (studentAttemptedLogs && studentAttemptedLogs.length) {
          const latestLog = studentAttemptedLogs[studentAttemptedLogs.length - 1];
          const filteredAssignments = get(latestLog, 'recordRawDump', []).filter((el) => {
            if (isHomework && el.isHomework) {
              return true;
            }
            if (!isHomework && !el.isHomework) {
              return true;
            }
            return false;
          });
          if (filteredAssignments.some((el) => el.attempted)) {
            if (isHomework) componentCounts.totalHomeworkAttemptedCount += 1;
            else componentCounts.totalClassworkAttemptedCount += 1;
          }
        }

        if (isHomework) {
          userSessionProgress.homeworkAssignmentLog.push(...(sortedComponentDumps || []));
          userSessionProgress.homeworkAssignmentLog = filterDuplicateComponentDumps(userSessionProgress.homeworkAssignmentLog);
        } else {
          userSessionProgress.classworkAssignmentLog.push(...(sortedComponentDumps || []));
          userSessionProgress.classworkAssignmentLog = filterDuplicateComponentDumps(userSessionProgress.classworkAssignmentLog);
        }
      }
      break;
    }
    case topicComponents.homeworkPractice:
    case topicComponents.blockBasedPractice: {
      const isHomework = componentName !== topicComponents.blockBasedPractice;
      if (isHomework) {
        componentCounts.totalHomeworkCount += 1;
        userSessionProgress.homeworkExists = true;
      } else { componentCounts.totalClassworkCount += 1; }

      let sortedComponentDumps = getCombinedAndSortedDumps(filteredComponentDumps, get(calculatedFields, 'classworkPracticeLog', []), componentName);
      if (isHomework) sortedComponentDumps = getCombinedAndSortedDumps(filteredComponentDumps, get(calculatedFields, 'homeworkPracticeLog', []), componentName);

      if (sortedComponentDumps && sortedComponentDumps.length) {
        if (isHomework) componentCounts.totalHomeworkVisitedCount += 1;
        else componentCounts.totalClassworkVisitedCount += 1;

        const filteredPracticeDumps = sortedComponentDumps.filter((doc) => (get(doc, 'componentId') === get(componentRule, 'blockBasedProject.typeId')));
        const studentAttemptedLogs = filteredPracticeDumps.filter((doc) => (doc.eventType === 'update'));
        if (studentAttemptedLogs && studentAttemptedLogs.length) {
          const latestLog = get(studentAttemptedLogs[studentAttemptedLogs.length - 1], 'recordRawDump', [])[0];
          const isAttempted = get(latestLog, 'link') || get(latestLog, 'savedBlocks') || get(latestLog, 'attachments', []).length;
          if (isAttempted) {
            if (isHomework) componentCounts.totalHomeworkAttemptedCount += 1;
            else componentCounts.totalClassworkAttemptedCount += 1;
          }
        }

        if (isHomework) {
          userSessionProgress.homeworkPracticeLog.push(...(filteredPracticeDumps || []));
          userSessionProgress.homeworkPracticeLog = filterDuplicateComponentDumps(userSessionProgress.homeworkPracticeLog);
        } else {
          userSessionProgress.classworkPracticeLog.push(...(filteredPracticeDumps || []));
          userSessionProgress.classworkPracticeLog = filterDuplicateComponentDumps(userSessionProgress.classworkPracticeLog);
        }
      }
      break;
    }
    case topicComponents.learningObjective: {
      componentCounts.totalClassworkCount += 1;

      const sortedComponentDumps = getCombinedAndSortedDumps(filteredComponentDumps, get(calculatedFields, 'pqComponentLog', []), componentName);
      const filteredLoDumps = sortedComponentDumps.filter((doc) => (doc.componentId === get(componentRule, 'learningObjective.typeId')), componentName);
      if (filteredLoDumps && filteredLoDumps.length) {
        componentCounts.totalClassworkVisitedCount += 1;

        const studentAttemptedLogs = filteredLoDumps.filter((doc) => get(doc, 'recordRawDump', []).length);
        if (studentAttemptedLogs && studentAttemptedLogs.length) {
          const latestDump = get(studentAttemptedLogs[studentAttemptedLogs.length - 1], 'recordRawDump', [])[0];
          componentCounts.pQ.totalCount += get(latestDump, 'questions', []).length;
          componentCounts.pQ.firstTryCount += get(latestDump, 'firstTryCount');
          componentCounts.pQ.secondTryCount += get(latestDump, 'secondTryCount');
          componentCounts.pQ.threeOrMoreTryCount += get(latestDump, 'threeOrMoreTryCount');

          componentCounts.totalClassworkAttemptedCount += 1;
        }
        userSessionProgress.pqComponentLog.push(...(filteredLoDumps || []));
        userSessionProgress.pqComponentLog = filterDuplicateComponentDumps(userSessionProgress.pqComponentLog);
      }
      break;
    }
    case topicComponents.quiz: {
      componentCounts.totalHomeworkCount += 1;
      userSessionProgress.homeworkExists = true;
      const sortedComponentDumps = getCombinedAndSortedDumps(filteredComponentDumps, get(calculatedFields, 'homeworkQuizLog', []), componentName);

      if (sortedComponentDumps && sortedComponentDumps.length) {
        componentCounts.totalHomeworkVisitedCount += 1;

        const latestDump = get(sortedComponentDumps[sortedComponentDumps.length - 1], 'recordRawDump', [])[0];

        if (latestDump && get(latestDump, 'totalQuestionCount')) {
          componentCounts.totalHomeworkAttemptedCount += 1;
        }
        const homeworkScore = get(latestDump, 'totalQuestionCount', 0) !== 0 ? ((get(latestDump, 'correctQuestionCount', 0) / get(latestDump, 'totalQuestionCount', 0)) * 100) : 0;
        userSessionProgress.homeworkScore = Number(homeworkScore.toFixed(0));

        userSessionProgress.homeworkQuizLog.push(...(sortedComponentDumps || []));
        userSessionProgress.homeworkQuizLog = filterDuplicateComponentDumps(userSessionProgress.homeworkQuizLog);
      }
      break;
    }
    default:
      break;
  }

  return { userSessionProgress, componentCounts };
};

const batchAndUpdateUserSessionReports = async () => {
  // Fetching all required data from database
  const {
    batchedUserSessionDump,
    userSessionDumpController,
    userSessionReportController,
    topicAggregationQuery,
    userSessionDumps,
    topics,
    ...requiredDBData
  } = await getAllRequiredDataFromDatabase();

  // Here iterating over each batchedUserSessionDump to create User's Session Report.
  if (batchedUserSessionDump && Object.keys(batchedUserSessionDump).length) {
    const userSessionReportUpdateDoc = [];
    Object.keys(batchedUserSessionDump).forEach((uniqueSessionRowKey) => {
      const sessionComponentsDump = batchedUserSessionDump[uniqueSessionRowKey];

      let classroomId; let topicId; let studentId;
      // Desctructuring uniqueSessionRowKey to get classroomId, topicId and studentId
      // eslint-disable-next-line prefer-const
      [classroomId, topicId, studentId] = uniqueSessionRowKey.split('-');
      const topicDoc = topics.find((topic) => get(topic, 'id') === topicId);

      // Filter and get base and caculatedFields Document.
      let {
        // eslint-disable-next-line prefer-const
        baseDocument, calculatedFields, sessionDetails,
      } = getBaseDocumentAndCalculatedFields({
        classroomId,
        topicId,
        studentId,
        topicDoc,
        ...requiredDBData,
      });

      let componentCountsMeta = {
        totalClassworkCount: 0,
        totalClassworkVisitedCount: 0,
        totalClassworkAttemptedCount: 0,
        totalHomeworkCount: 0,
        totalHomeworkVisitedCount: 0,
        totalHomeworkAttemptedCount: 0,
        pQ: {
          totalCount: 0,
          firstTryCount: 0,
          secondTryCount: 0,
          threeOrMoreTryCount: 0,
        },
      };
      // Iterating over session's component rules to calculate progress
      let sessionComponentRule = get(sessionDetails, 'topic.topicComponentRule');
      if (!sessionComponentRule && topicDoc && topicDoc.topicComponentRule && topicDoc.topicComponentRule.length) {
        sessionComponentRule = get(topicDoc, 'topicComponentRule', []);
      }
      (sessionComponentRule || [])
        .forEach((componentRule) => {
          const { componentName } = componentRule;
          const filteredComponentDumps = sessionComponentsDump.filter((componentDump) => get(componentDump, 'componentType') === componentName);

          const { userSessionProgress, componentCounts } = calculateFieldsBasedOnComponentType(
            componentName,
            calculatedFields,
            filteredComponentDumps,
            componentRule,
            componentCountsMeta,
          );

          calculatedFields = userSessionProgress;
          componentCountsMeta = componentCounts;
        });

      const classworkScore = componentCountsMeta.pQ.totalCount !== 0 ? ((
        ((componentCountsMeta.pQ.firstTryCount * 10) + (componentCountsMeta.pQ.secondTryCount * 8) + (componentCountsMeta.pQ.threeOrMoreTryCount * 6)) / (componentCountsMeta.pQ.totalCount * 10)
      ) * 100) : 0;
      calculatedFields.classworkScore = Number(classworkScore.toFixed(0));

      calculatedFields.classworkVisited = (componentCountsMeta.totalClassworkCount !== 0 && componentCountsMeta.totalClassworkVisitedCount !== 0) ? Number(((componentCountsMeta.totalClassworkVisitedCount / componentCountsMeta.totalClassworkCount) * 100).toFixed(0)) : 0;

      calculatedFields.classworkAttempted = (componentCountsMeta.totalClassworkCount !== 0 && componentCountsMeta.totalClassworkAttemptedCount !== 0) ? Number(((componentCountsMeta.totalClassworkAttemptedCount / componentCountsMeta.totalClassworkCount) * 100).toFixed(0)) : 0;

      calculatedFields.homeworkVisited = (componentCountsMeta.totalHomeworkCount !== 0 && componentCountsMeta.totalHomeworkVisitedCount !== 0) ? Number(((componentCountsMeta.totalHomeworkVisitedCount / componentCountsMeta.totalHomeworkCount) * 100).toFixed(0)) : 0;

      calculatedFields.homeworkAttempted = (componentCountsMeta.totalHomeworkCount !== 0 && componentCountsMeta.totalHomeworkAttemptedCount !== 0) ? Number(((componentCountsMeta.totalHomeworkAttemptedCount / componentCountsMeta.totalHomeworkCount) * 100).toFixed(0)) : 0;

      calculatedFields.proficiency = Number(((0.5 * (calculatedFields.classworkScore || 0)) + (0.5 * (calculatedFields.homeworkScore || 0))).toFixed(0));

      userSessionReportUpdateDoc.push({ ...baseDocument, ...calculatedFields });
    });
    // Add or Update record in PG SQL
    if (userSessionReportUpdateDoc && userSessionReportUpdateDoc.length) {
      await userSessionReportController.Model.bulkCreate(userSessionReportUpdateDoc, { updateOnDuplicate: sqlColumnsToUpdate }).then(() => log('Session Report Updated!!'));
    }
    // delete record from sql dump
    // eslint-disable-next-line no-constant-condition
    if (false) {
      const idsToDelete = userSessionDumps.map((dump) => dump.id);
      await userSessionDumpController.Model.destroy({ where: { id: idsToDelete } });
    }
  }
};

export default batchAndUpdateUserSessionReports;

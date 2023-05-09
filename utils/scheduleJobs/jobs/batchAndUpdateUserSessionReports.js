import cuid from 'cuid';
import { get, sortBy } from 'lodash';
import { AggregationBuilder } from 'mongodb-aggregation-builder';
import { ConditionPayload, EqualityPayload } from 'mongodb-aggregation-builder/helpers';
import { ArrayElemAt } from 'mongodb-aggregation-builder/operators';
import Sequelize from 'sequelize';
import { topicComponents } from '../../../constants';
import { QueryController } from '../../../src/autoGenerate/graphql/controllers';
import MasterController from '../../../src/autoGenerate/graphql/controllers/MasterController';
import { log } from '../../log';
import { currentModelName } from '../../../src/autoGenerate/utils/differentVersionsOfModal';

const SequelizeOperation = Sequelize.Op;

const sqlColumnsToUpdate = ['userId', 'userName', 'userRole', 'studentGrade', 'studentSection', 'classroomId', 'classroomTitle', 'schoolId', 'schoolName', 'topicId', 'sessionId', 'sessionTitle', 'sessionType', 'courseId', 'courseTitle', 'courseCategory', 'sessionStart', 'sessionEnd', 'sessionCreationDate', 'sessionUpdationAt', 'sessionDuration', 'sessionStatus', 'studentAttendance', 'classroomStudentsCount', 'teacherTaughtName', 'teacherTaughtId', 'sessionClassworkComponents', 'sessionHomeworkComponents', 'classworkVisited', 'classworkAttempted', 'homeworkVisited', 'homeworkAttempted', 'classworkScore', 'homeworkScore', 'proficiency', 'homeworkExists', 'videoComponentLog', 'pqComponentLog', 'classworkAssignmentLog', 'homeworkAssignmentLog', 'classworkPracticeLog', 'homeworkPracticeLog', 'homeworkQuizLog', 'previousLogs'];

const getBatchedUserSessionDump = (userSessionDumps) => {
  const batchedUserSessionDump = {};
  const batchedSessionDump = {};
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
        componentType,
      } = userSessionDump;

      if (componentType === 'batchSession') {
        if (!batchedSessionDump[componentId]) {
          batchedSessionDump[componentId] = [];
        }
        batchedSessionDump[componentId].push(userSessionDump);
      } else if (classroomId && topicId && userId && componentId && (componentType !== 'batchSession')) {
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
    batchedSessionDump,
  };
};

const getDatabaseControllers = () => {
  const authentication = { bypass: true };
  const userSessionDumpController = new MasterController(currentModelName('UserSessionDump', 'previous'), authentication);

  const batchSessionController = new QueryController('BatchSession', authentication);

  const topicController = new QueryController('Topic', authentication);

  const userController = new QueryController('User', { bypass: true });

  const batchController = new QueryController('Batch', authentication);

  const userSessionReportController = new MasterController(currentModelName('UserLevelSessionReport', 'previous'), {
    bypass: true,
  });

  return {
    userSessionDumpController,
    batchSessionController,
    topicController,
    userController,
    userSessionReportController,
    batchController,
  };
};

const getAggregationQueries = (documentIdsToFetch) => {
  let batchSessionAggregationQuery = [];
  let topicAggregationQuery = [];
  let userAggregationQuery = [];
  let batchAggregationQuery = [];
  if (Object.values(documentIdsToFetch.batchSessionFilters).length) {
    batchSessionAggregationQuery = new AggregationBuilder('BatchSession')
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
              id: 1, classroomTitle: 1, code: 1, school: ArrayElemAt('$school', 0), allottedMentor: ArrayElemAt('$allottedMentor', 0), createdAt: 1, updatedAt: 1, isTeacherTraining: 1,
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
  }

  if (documentIdsToFetch.topicIds && Array.from(documentIdsToFetch.topicIds).length) {
    topicAggregationQuery = new AggregationBuilder('Topic')
      .Match({ id: { $in: Array.from(documentIdsToFetch.topicIds) } })
      .Lookup(EqualityPayload('Course', 'courses', 'courses.typeId', 'id'))
      .getPipeline();
  }

  if (documentIdsToFetch.userIds && Array.from(documentIdsToFetch.userIds).length) {
    userAggregationQuery = new AggregationBuilder('User')
      .Match({ id: { $in: Array.from(documentIdsToFetch.userIds) } })
      .Lookup(EqualityPayload('StudentProfile', 'studentProfile', 'studentProfile.typeId', 'id'))
      .Project({
        id: 1,
        name: 1,
        studentProfile: ArrayElemAt('$studentProfile', 0),
      })
      .getPipeline();
  }
  if (documentIdsToFetch.classroomIds && Array.from(documentIdsToFetch.classroomIds).length) {
    batchAggregationQuery = new AggregationBuilder('Batch')
      .Match({ id: { $in: Array.from(documentIdsToFetch.classroomIds) } })
      .Lookup(EqualityPayload('StudentProfile', 'students', 'students.typeId', 'id'))
      .Lookup(EqualityPayload('StudentProfile', 'batchStudents', 'batchStudents.typeId', 'id'))
      .Lookup(EqualityPayload('School', 'school', 'school.typeId', 'id'))
      .Lookup(EqualityPayload('User', 'allottedMentor', 'allottedMentor.typeId', 'id'))
      .Project({
        id: 1,
        classroomTitle: 1,
        code: 1,
        school: ArrayElemAt('$school', 0),
        allottedMentor: ArrayElemAt('$allottedMentor', 0),
        students: 1,
        batchStudents: 1,
        createdAt: 1,
        updatedAt: 1,
        isTeacherTraining: 1,
      })
      .getPipeline();
  }

  return {
    batchSessionAggregationQuery,
    userAggregationQuery,
    topicAggregationQuery,
    batchAggregationQuery,
  };
};

const getAllRequiredDataFromDatabase = async () => {
  // Get all required controllers
  const {
    userSessionDumpController,
    batchSessionController,
    topicController,
    userController,
    batchController,
    userSessionReportController,
  } = getDatabaseControllers();

  // Fetching All Dumps From Postgres.
  const userSessionDumps = await userSessionDumpController.Model.findAll({ raw: true });

  if (userSessionDumps && userSessionDumps.length) {
    // Batch User Session Dumps based on Classroom, Topic and UserId
    const {
      batchedUserSessionDump,
      batchedSessionDump,
      documentIdsToFetch,
    } = getBatchedUserSessionDump(userSessionDumps);

    const {
      batchSessionAggregationQuery,
      userAggregationQuery,
      topicAggregationQuery,
      batchAggregationQuery,
    } = getAggregationQueries(documentIdsToFetch);

    // Fetching BatchSession and User Data from mongo.
    let batchSessions = [];
    let topics = [];
    let users = [];
    let batches = [];
    if (batchSessionAggregationQuery.length) batchSessions = await batchSessionController.aggregate(batchSessionAggregationQuery);
    if (topicAggregationQuery.length) topics = await topicController.aggregate(topicAggregationQuery);
    if (userAggregationQuery.length) users = await userController.aggregate(userAggregationQuery);
    if (batchAggregationQuery.length) batches = await batchController.aggregate(batchAggregationQuery);

    let userSessionReports = [];
    // Creating Filter Array for fetching UserSessionReport
    if (batchedUserSessionDump && Object.keys(batchedUserSessionDump).length) {
      const sessionReportFilterArray = Object.keys(batchedUserSessionDump).map((uniqueSessionRowKey) => {
        const sessionRowSplitArray = uniqueSessionRowKey.split('-');
        return {
          [SequelizeOperation.and]: [
            { classroomId: sessionRowSplitArray[0] },
            { topicId: sessionRowSplitArray[1] },
            { userId: sessionRowSplitArray[2] },
          ],
        };
      });

      // Fetch Existing UserSessionReport from Postgres
      userSessionReports = await userSessionReportController.Model.findAll({
        where: { [SequelizeOperation.or]: sessionReportFilterArray },
        raw: true,
      });
    }

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
      batchedSessionDump,
      batches,
    };
  }
  return {
    batchSessions: [],
    users: [],
    topics: [],
    userSessionDumps: [],
    userSessionReports: [],
    batchedUserSessionDump: null,
    topicAggregationQuery: [],
    userSessionDumpController,
    userSessionReportController,
    batches: [],
  };
};

const getBaseDocumentAndCalculatedFields = ({
  classroomId, userId, topicId, userSessionReports, topicDoc, batchSessions, users, batches,
}) => {
  // Check if userSessionReport already exists
  const existingSessionReport = (userSessionReports || []).find((report) => (
    (report.topicId === topicId)
      && (report.userId === userId)
      && (report.classroomId === classroomId)
  ));

  // Get User Details
  const userDetails = (users || []).find((user) => (user.id === userId));

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

  let userRole = get(userDetails, 'studentProfile.mentor.typeId') ? 'Teacher' : 'Student';
  let isTeacherTrainingBatch = get(sessionDetails, 'batch.isTeacherTraining', false);
  let teacherTaughtId = get(existingSessionReport, 'teacherTaughtId') || get(sessionDetails, 'batch.allottedMentor.id');
  if (isTeacherTrainingBatch) {
    if (userId !== teacherTaughtId && studentAttendanceDoc) userRole = 'TeacherTraining';
    else userRole = 'Trainer';
  }

  const sessionComponentRule = get(topicDoc, 'topicComponentRule') || get(sessionDetails, 'topic.topicComponentRule') || [];
  const sessionClassworkComponents = sessionComponentRule.filter((component) => !['homeworkAssignment', 'quiz', 'homeworkPractice'].includes(component.componentName));
  const sessionHomeworkComponents = sessionComponentRule.filter((component) => ['homeworkAssignment', 'quiz', 'homeworkPractice'].includes(component.componentName));

  const baseDocument = {
    id: cuid(),
    exists: !!existingSessionReport,
    userId,
    userName: get(userDetails, 'name') || get(existingSessionReport, 'userName', ''),
    userRole: userRole || get(existingSessionReport, 'userRole', ''),
    studentGrade: get(userDetails, 'studentProfile.grade') || get(existingSessionReport, 'studentGrade', ''),
    studentSection: get(userDetails, 'studentProfile.section') || get(existingSessionReport, 'studentSection', ''),
    classroomId,
    classroomTitle: get(sessionDetails, 'batch.classroomTitle'),
    classroomStudentsCount: get(sessionDetails, 'attendance', []).length,
    schoolId: get(sessionDetails, 'batch.school.id'),
    schoolName: get(sessionDetails, 'batch.school.name'),
    topicId,
    sessionId: get(sessionDetails, 'id'),
    sessionTitle: get(topicDoc, 'title') || get(sessionDetails, 'topic.title'),
    sessionType: get(topicDoc, 'classType') || get(sessionDetails, 'topic.classType') || 'lab',
    courseId: get(topicDoc, 'courses[0].id') || get(sessionDetails, 'course.id'),
    courseTitle: get(topicDoc, 'courses[0].title') || get(sessionDetails, 'course.title'),
    courseCategory: get(topicDoc, 'courses[0].category') || get(sessionDetails, 'course.category'),
    sessionStart: get(sessionDetails, 'sessionStartDate'),
    sessionEnd: get(sessionDetails, 'sessionEndDate'),
    sessionDuration: Math.round(sessionDuration || 0),
    sessionStatus: get(sessionDetails, 'sessionStatus'),
    studentAttendance,
    sessionCreationDate: get(sessionDetails, 'createdAt'),
    sessionUpdationAt: get(sessionDetails, 'updatedAt'),
    teacherTaughtName: get(existingSessionReport, 'teacherTaughtName') || get(sessionDetails, 'batch.allottedMentor.name'),
    teacherTaughtId,
    sessionClassworkComponents,
    sessionHomeworkComponents,
  };

  if (!sessionDetails) {
    // If Session does not exist for the classroomId and topicId, will get the basic details from batch
    const batchDetails = (batches || []).find((batch) => get(batch, 'id') === classroomId);
    if (batchDetails) {
      let userRoleFromBaseDocument = get(baseDocument, 'userRole');

      const batchStudentsArray = [...(get(batchDetails, 'students', []) || []), ...(get(batchDetails, 'batchStudents', []) || [])];
      const isUserAddedInBatch = batchStudentsArray.find((student) => get(student, 'id') === get(userDetails, 'studentProfile.id'));

      teacherTaughtId = get(existingSessionReport, 'teacherTaughtId') || get(batchDetails, 'allottedMentor.id');
      const teacherTaughtName = get(existingSessionReport, 'teacherTaughtName') || get(batchDetails, 'allottedMentor.name');

      isTeacherTrainingBatch = get(batchDetails, 'isTeacherTraining', false);
      if (isTeacherTrainingBatch) {
        // Assigning teacherTaughtId to check for for the userRole

        if (userId !== teacherTaughtId && isUserAddedInBatch) userRoleFromBaseDocument = 'TeacherTraining';
        else userRoleFromBaseDocument = 'Trainer';
      }

      // Updating the basic details in the baseDocument
      Object.assign(baseDocument, {
        classroomTitle: get(batchDetails, 'classroomTitle'),
        schoolId: get(batchDetails, 'school.id'),
        schoolName: get(batchDetails, 'school.name'),
        teacherTaughtId,
        teacherTaughtName,
        userRole: userRoleFromBaseDocument,
      });
    }
  }

  // If userSessionReport already exists, then use the id from it.
  if (existingSessionReport && get(existingSessionReport, 'id')) {
    baseDocument.id = get(existingSessionReport, 'id');
    baseDocument.previousLogs = [...(get(existingSessionReport, 'previousLogs') || []), existingSessionReport].map(({
      previousLogs, videoComponentLog, pqComponentLog, classworkAssignmentLog, homeworkAssignmentLog, classworkPracticeLog, homeworkPracticeLog, homeworkQuizLog, ...requiredLogs
    }) => requiredLogs);
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
    videoComponentLog: get(existingSessionReport, 'videoComponentLog', []) || [],
    pqComponentLog: get(existingSessionReport, 'pqComponentLog', []) || [],
    classworkAssignmentLog: get(existingSessionReport, 'classworkAssignmentLog', []) || [],
    homeworkAssignmentLog: get(existingSessionReport, 'homeworkAssignmentLog', []) || [],
    classworkPracticeLog: get(existingSessionReport, 'classworkPracticeLog', []) || [],
    homeworkPracticeLog: get(existingSessionReport, 'homeworkPracticeLog', []) || [],
    homeworkQuizLog: get(existingSessionReport, 'homeworkQuizLog', []) || [],
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
  if (previousDumps && previousDumps.length) {
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
  return previousDumps || [];
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

      let sortedComponentDumps = getCombinedAndSortedDumps(filteredComponentDumps, get(calculatedFields, 'classworkAssignmentLog', []), componentName);
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
      const filteredLoDumps = sortedComponentDumps.filter((doc) => (doc.componentId === get(componentRule, 'learningObjective.typeId')));
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
  log('Generating User Session Reports');
  let queryMessageString = '';
  try {
    const {
      batchedUserSessionDump,
      userSessionDumpController,
      userSessionReportController,
      topicAggregationQuery,
      userSessionDumps,
      topics,
      batchedSessionDump,
      ...requiredDBData
    } = await getAllRequiredDataFromDatabase();

    // Here iterating over each batchedUserSessionDump to create User's Session Report.
    if (batchedUserSessionDump && Object.keys(batchedUserSessionDump).length) {
      log(`Total Batched Dumps ${Object.keys(batchedUserSessionDump).length}`);
      const userSessionReportUpdateDoc = [];
      Object.keys(batchedUserSessionDump).forEach((uniqueSessionRowKey) => {
        const sessionComponentsDump = batchedUserSessionDump[uniqueSessionRowKey];

        let classroomId; let topicId; let userId;
        // Desctructuring uniqueSessionRowKey to get classroomId, topicId and userId
        // eslint-disable-next-line prefer-const
        [classroomId, topicId, userId] = uniqueSessionRowKey.split('-');
        const topicDoc = topics.find((topic) => get(topic, 'id') === topicId);

        if (!topicDoc) { return; }
        // Filter and get base and caculatedFields Document.
        let {
          // eslint-disable-next-line prefer-const
          baseDocument, calculatedFields, sessionDetails,
        } = getBaseDocumentAndCalculatedFields({
          classroomId,
          topicId,
          userId,
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
            let filteredComponentDumps = sessionComponentsDump.filter((componentDump) => get(componentDump, 'componentType') === componentName);
            if (componentName === topicComponents.learningObjective) {
              const practiceDumps = sessionComponentsDump.filter((componentDump) => get(componentDump, 'componentType') === 'practiceQuestion');
              filteredComponentDumps = [...(filteredComponentDumps || []), ...(practiceDumps || [])];
            }

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
      log(`Session Report Built: ${userSessionReportUpdateDoc.length || 0}`);
      queryMessageString += `Rows Affected: ${userSessionReportUpdateDoc.length || 0}`;

      if (userSessionReportUpdateDoc && userSessionReportUpdateDoc.length) {
        await userSessionReportController.Model.bulkCreate(userSessionReportUpdateDoc, { updateOnDuplicate: sqlColumnsToUpdate }).then((response) => {
          log(`Session Report Updated, Total Count: ${(response || []).length}`);
        }).catch((error) => {
          throw new Error(error);
        });
      }
      // delete record from sql dump
      const idsToDelete = new Set();
      Object.keys(batchedUserSessionDump).forEach((uniqueSessionRowKey) => {
        if (batchedUserSessionDump && batchedUserSessionDump[uniqueSessionRowKey].length) {
          batchedUserSessionDump[uniqueSessionRowKey].forEach((dump) => idsToDelete.add(dump.id));
        }
      });
      log(`Deleting Previous Dumps, Total Count: ${idsToDelete.size}`);
      await userSessionDumpController.Model.destroy({ where: { id: Array.from(idsToDelete) } });
      queryMessageString += ` | Rows Deleted: ${idsToDelete.size}`;
    }
    if (batchedSessionDump && Object.keys(batchedSessionDump).length) {
      // TODO : Add logic to update session report in PG SQL
    }
    return {
      result: true,
      message: queryMessageString,
    };
  } catch (e) {
    log(e, 'error');
    return {
      result: false,
      message: queryMessageString,
      error: e,
    };
  }
};

export default batchAndUpdateUserSessionReports;

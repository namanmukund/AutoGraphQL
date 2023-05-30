/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-loop-func */
/* eslint-disable no-restricted-syntax */
import { get, sortBy } from 'lodash';
import { AggregationBuilder } from 'mongodb-aggregation-builder';
import { callLocalGraphqlApi } from '../../../../../api';
import { currentModelName } from '../../../../utils/differentVersionsOfModal';
import { QueryController } from '../../../controllers';
import MasterController from '../../../controllers/MasterController';

const updateComponentLogsInPGData = async (context) => {
  const batchesRes = await callLocalGraphqlApi(`{
    batches(
        filter: {
        and: [
            { documentType: classroom }
            {
            createdAt_gte: "Sun Jan 01 2023 00:00:00 GMT+0530 (India Standard Time)"
            }
        ]
        }
    ) {
        id
    }
    }
    `, context);
  const batchIds = get(batchesRes, 'data.batches', []).map((batch) => get(batch, 'id'));
  const userSessionReportController = new MasterController(currentModelName('UserLevelSessionReport', 'previous'), {
    bypass: true,
  });
  const assignmentQuestionsController = new QueryController('AssignmentQuestion', { bypass: true });
  const assignmentAggregation = new AggregationBuilder('AssignmentQuestion')
    .Project({
      id: 1,
      isHomework: 1,
    })
    .getPipeline();
  const assignmentQuestions = await assignmentQuestionsController.aggregate(assignmentAggregation);
  console.log({ assignmentQuestions: JSON.stringify(assignmentQuestions) });
  let batchIdIndex = 1;
  const updatedBatches = [];
  for (const batchId of batchIds) {
    const userSessionReports = await userSessionReportController.Model.findAll({
      where: { classroomId: [batchId] },
      attributes: ['id', 'classworkAssignmentLog'],
      raw: true,
    });
    const userLevelSessionReportToUpdate = [];
    for (const userSessionReport of userSessionReports) {
      const { id, classworkAssignmentLog } = userSessionReport;
      if (classworkAssignmentLog && classworkAssignmentLog.length) {
        let shouldUpdate = false;
        const newClassworkAssignmentLog = [...classworkAssignmentLog];
        newClassworkAssignmentLog.forEach((classworkAssignment) => {
          if (get(classworkAssignment, 'recordRawDump', []).length) {
            get(classworkAssignment, 'recordRawDump', []).forEach((recordDump) => {
              if (get(recordDump, 'codingAssignmentId')) {
                const assignmentQuestion = assignmentQuestions && assignmentQuestions.find((assignment) => get(assignment, 'id') === get(recordDump, 'codingAssignmentId'));
                const isHomeworkFromRecord = get(recordDump, 'isHomework', false);
                if (assignmentQuestion && get(assignmentQuestion, 'isHomework') !== isHomeworkFromRecord) {
                  shouldUpdate = true;
                  Object.assign(recordDump, {
                    isHomework: get(assignmentQuestion, 'isHomework'),
                  });
                }
              }
            });
          }
        });
        if (shouldUpdate) {
          userLevelSessionReportToUpdate.push({ id, classworkAssignmentLog: newClassworkAssignmentLog });
        }
      }
    }
    let index = 0;
    console.log({ userLevelSessionReportToUpdate: userLevelSessionReportToUpdate.length });
    for (const userLevelSessionReport of userLevelSessionReportToUpdate) {
      const { id, classworkAssignmentLog } = userLevelSessionReport;
      await userSessionReportController.Model.update({ classworkAssignmentLog }, { where: { id } });
      console.log('Processed data at index ========', index);
      index += 1;
    }
    if (userLevelSessionReportToUpdate.length) {
      updatedBatches.push(batchId);
    }
    console.log('Processed batch data at index ========', batchIdIndex);
    batchIdIndex += 1;
  }
  // const userSessionReportsUpdated = await userSessionReportController.Model.findAll({
  //   where: { classroomId: batchIds },
  //   attributes: ['id', 'videoComponentLog', 'pqComponentLog', 'classworkAssignmentLog', 'classworkPracticeLog', 'sessionClassworkComponents'],
  //   limit: 10000,
  //   raw: true,
  // });
  // for (const userSessionReport of userSessionReportsUpdated) {
  //   const {
  //     videoComponentLog, pqComponentLog, classworkAssignmentLog, classworkPracticeLog, sessionClassworkComponents,
  //   } = userSessionReport;
  //   if (sessionClassworkComponents && sessionClassworkComponents.length) {
  //     const componentCountsMeta = {
  //       videosCount: 0,
  //       videosVisitedCount: 0,
  //       codingAssignmentsCount: 0,
  //       codingAssignmentsAttemptedCount: 0,
  //       practicesCount: 0,
  //       practicesAttemptedCount: 0,
  //       practiceQuestionTriesLogs: [],
  //       allPracticeQuestions: [],
  //     };
  //     sessionClassworkComponents.forEach((component) => {
  //       switch (get(component, 'componentName')) {
  //         case 'video':
  //           if (get(component, 'video.typeId')) {
  //             componentCountsMeta.videosCount += 1;
  //           }
  //           if (videoComponentLog && videoComponentLog.length) {
  //             const newVideoComponentLog = sortBy([...videoComponentLog], 'mongoDocCreatedAt').filter((videoLog) => get(videoLog, 'componentId') === get(component, 'video.typeId'));
  //             const latestVideoComponentLog = newVideoComponentLog.length ? newVideoComponentLog[newVideoComponentLog.length - 1] : null;
  //             if (latestVideoComponentLog) {
  //               componentCountsMeta.videosVisitedCount += 1;
  //             }
  //           }
  //           break;
  //         case 'learningObjective':
  //           if (pqComponentLog && pqComponentLog.length) {
  //             const newPqComponentLog = sortBy([...pqComponentLog], 'mongoDocCreatedAt').filter((pqLog) => get(pqLog, 'componentId') === get(component, 'learningObjective.typeId'));
  //             const latestPQLog = newPqComponentLog.length ? newPqComponentLog[newPqComponentLog.length - 1] : null;
  //             if (latestPQLog) {
  //               // todo logic
  //             }
  //           }
  //           break;
  //         case 'assignment':
  //           if (classworkAssignmentLog && classworkAssignmentLog.length) {
  //             const newClassworkAssignmentLog = sortBy([...classworkAssignmentLog], 'mongoDocCreatedAt');
  //             const latestAssignmentLog = newClassworkAssignmentLog.length ? newClassworkAssignmentLog[newClassworkAssignmentLog.length - 1] : null;
  //             if (latestAssignmentLog) {
  //               const totalAssignments = get(latestAssignmentLog, 'reportDump', []).filter((el) => !get(el, 'isHomework'));
  //               componentCountsMeta.codingAssignmentsCount += (totalAssignments || []).length;
  //               componentCountsMeta.codingAssignmentsAttemptedCount += (totalAssignments || []).filter((el) => get(el, 'code')).length;
  //             }
  //           }
  //           break;
  //         case 'blockBasedPractice':
  //           if (get(component, 'blockBasedProject.typeId')) {
  //             componentCountsMeta.practicesCount += 1;
  //           }
  //           if (classworkPracticeLog && classworkPracticeLog.length) {
  //             const newClassworkPracticeLog = sortBy([...classworkPracticeLog], 'mongoDocCreatedAt').filter((practiceLog) => get(practiceLog, 'componentId') === get(component, 'blockBasedProject.typeId'));
  //             const latestPracticeLog = get(newClassworkPracticeLog[newClassworkPracticeLog.length - 1], 'recordRawDump', [])[0];
  //             if (latestPracticeLog) {
  //               const isAttempted = get(latestPracticeLog, 'link') || get(latestPracticeLog, 'savedBlocks') || get(latestPracticeLog, 'attachments', []).length;
  //               if (isAttempted) componentCountsMeta.practicesAttemptedCount += 1;
  //             }
  //           }
  //           break;
  //         default:
  //           break;
  //       }
  //     });
  //   }
  // }
};

export default updateComponentLogsInPGData;

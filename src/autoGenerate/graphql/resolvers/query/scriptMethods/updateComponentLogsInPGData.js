/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-loop-func */
/* eslint-disable no-restricted-syntax */
import { get, isEqual, sortBy } from 'lodash';
import { AggregationBuilder } from 'mongodb-aggregation-builder';
import { getClassworkComponentScore } from '../../../../../../utils/scheduleJobs/jobs/batchAndUpdateUserSessionReports';
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
}`, context);
  const batchIds = get(batchesRes, 'data.batches', []).map((batch) => get(batch, 'id'));
  const userSessionReportController = new MasterController(currentModelName('UserLevelSessionReport', 'previous'), {
    bypass: true,
  });
  const learningObjectivesRes = await callLocalGraphqlApi(`{
    learningObjectives(filter: { status: published }) {
      id
      title
      questionBank(
        filter: {
          and: [{ status: published }, { assessmentType: practiceQuestion }]
        }
      ) {
        id
        order
      }
    }
  }
  `, context);
  const learningObjectives = get(learningObjectivesRes, 'data.learningObjectives', []);
  // const assignmentQuestionsController = new QueryController('AssignmentQuestion', { bypass: true });
  // const assignmentAggregation = new AggregationBuilder('AssignmentQuestion')
  //   .Project({
  //     id: 1,
  //     isHomework: 1,
  //   })
  //   .getPipeline();
  // const assignmentQuestions = await assignmentQuestionsController.aggregate(assignmentAggregation);
  let batchIdIndex = 1;
  // const updatedBatches = [];
  let totalDocsUpdated = 0;
  console.log({ batchIds: batchIds.length });
  // for (const batchId of batchIds) {
  //   const userSessionReports = await userSessionReportController.Model.findAll({
  //     where: { classroomId: [batchId] },
  //     attributes: ['id', 'classworkAssignmentLog'],
  //     raw: true,
  //   });
  //   console.log({ userSessionReports: userSessionReports.length });
  //   const userLevelSessionReportToUpdate = [];
  //   for (const userSessionReport of userSessionReports) {
  //     const { id, classworkAssignmentLog } = userSessionReport;
  //     if (classworkAssignmentLog && classworkAssignmentLog.length) {
  //       let shouldUpdate = false;
  //       const newClassworkAssignmentLog = [...classworkAssignmentLog];
  //       newClassworkAssignmentLog.forEach((classworkAssignment) => {
  //         if (get(classworkAssignment, 'recordRawDump', []).length) {
  //           get(classworkAssignment, 'recordRawDump', []).forEach((recordDump) => {
  //             if (get(recordDump, 'codingAssignmentId')) {
  //               const assignmentQuestion = assignmentQuestions && assignmentQuestions.find((assignment) => get(assignment, 'id') === get(recordDump, 'codingAssignmentId'));
  //               const isHomeworkFromRecord = get(recordDump, 'isHomework', false);
  //               if (assignmentQuestion && get(assignmentQuestion, 'isHomework') !== isHomeworkFromRecord) {
  //                 shouldUpdate = true;
  //                 Object.assign(recordDump, {
  //                   isHomework: get(assignmentQuestion, 'isHomework'),
  //                 });
  //               }
  //             }
  //           });
  //         }
  //       });
  //       if (shouldUpdate) {
  //         userLevelSessionReportToUpdate.push({ id, classworkAssignmentLog: newClassworkAssignmentLog });
  //       }
  //     }
  //   }
  //   for (const userLevelSessionReport of userLevelSessionReportToUpdate) {
  //     const { id, classworkAssignmentLog } = userLevelSessionReport;
  //     await userSessionReportController.Model.update({ classworkAssignmentLog }, { where: { id } });
  //   }
  //   if (userLevelSessionReportToUpdate.length) {
  //     updatedBatches.push(batchId);
  //     totalDocsUpdated += userLevelSessionReportToUpdate.length;
  //   }
  //   console.log('Processed batch data at index ========', batchIdIndex, batchIds.length, ' total data updated: ', userLevelSessionReportToUpdate.length);
  //   batchIdIndex += 1;
  // }
  for (const batchId of batchIds) {
    const userSessionReportsUpdated = await userSessionReportController.Model.findAll({
      where: { classroomId: [batchId] },
      attributes: ['id', 'videoComponentLog', 'pqComponentLog', 'classworkAssignmentLog', 'classworkPracticeLog', 'sessionClassworkComponents',
        'videosCount',
        'videosVisitedCount',
        'videosVisitedPercent',
        'practiceQuestionsCount',
        'practiceQuestionsAttemptedCount',
        'practiceQuestionsAttemptedPercent',
        'codingAssignmentsCount',
        'codingAssignmentsAttemptedCount',
        'codingAssignmentsAttemptedPercent',
        'practicesCount',
        'practicesAttemptedCount',
        'practicesAttemptedPercent',
        'latestPracticeQuestionTriesLoWise',
        'latestPracticeQuestionTriesSessionWise',
        'averageCorrectPracticeQuestionTries',
      ],
      raw: true,
    });
    let updateIndex = 1;
    for (const userSessionReport of userSessionReportsUpdated) {
      const {
        id, videoComponentLog, pqComponentLog, classworkAssignmentLog, classworkPracticeLog, sessionClassworkComponents, ...restObj
      } = userSessionReport;
      if (sessionClassworkComponents && sessionClassworkComponents.length) {
        const componentCountsMeta = {
          videosCount: 0,
          videosVisitedCount: 0,
          codingAssignmentsCount: 0,
          codingAssignmentsAttemptedCount: 0,
          practicesCount: 0,
          practicesAttemptedCount: 0,
          practiceQuestionTriesLogs: [],
          allPracticeQuestions: [],
        };
        sessionClassworkComponents.forEach((component) => {
          switch (get(component, 'componentName')) {
            case 'video':
              if (get(component, 'video.typeId')) {
                componentCountsMeta.videosCount += 1;
              }
              if (videoComponentLog && videoComponentLog.length) {
                const newVideoComponentLog = sortBy([...videoComponentLog], 'mongoDocUpdatedAt').filter((videoLog) => get(videoLog, 'componentId') === get(component, 'video.typeId'));
                const latestVideoComponentLog = newVideoComponentLog.length ? newVideoComponentLog[newVideoComponentLog.length - 1] : null;
                if (latestVideoComponentLog) {
                  componentCountsMeta.videosVisitedCount += 1;
                }
              }
              break;
            case 'learningObjective':
              if (pqComponentLog && pqComponentLog.length) {
                const newPqComponentLog = sortBy([...pqComponentLog], 'mongoDocUpdatedAt').filter((pqLog) => get(pqLog, 'componentId') === get(component, 'learningObjective.typeId') && get(pqLog, 'recordRawDump', []).length);
                const latestPQLog = newPqComponentLog.length ? get(newPqComponentLog[newPqComponentLog.length - 1], 'recordRawDump', [])[0] : null;
                if (latestPQLog) {
                  const learningObjective = learningObjectives.find((lo) => get(lo, 'id') === get(component, 'learningObjective.typeId'));
                  // todo logic
                  if (learningObjective && get(learningObjective, 'questionBank', []).length) {
                    get(learningObjective, 'questionBank', []).forEach((question, index) => {
                      componentCountsMeta.allPracticeQuestions.push({
                        ...question,
                        questionNo: index + 1,
                        learningObjectiveId: get(learningObjective, 'id'),
                      });
                    });
                  }
                  (get(latestPQLog, 'questions', []) || []).forEach((question) => {
                    componentCountsMeta.practiceQuestionTriesLogs.push({
                      ...question,
                      learningObjectiveId: get(learningObjective, 'id'),
                    });
                  });
                }
              }
              break;
            case 'assignment':
              if (classworkAssignmentLog && classworkAssignmentLog.length) {
                const newClassworkAssignmentLog = sortBy([...classworkAssignmentLog], 'mongoDocUpdatedAt').filter((doc) => (doc.eventType === 'update'));
                const latestAssignmentLog = newClassworkAssignmentLog.length ? newClassworkAssignmentLog[newClassworkAssignmentLog.length - 1] : null;
                if (latestAssignmentLog) {
                  const totalAssignments = get(latestAssignmentLog, 'recordRawDump', []).filter((el) => !get(el, 'isHomework'));
                  componentCountsMeta.codingAssignmentsCount += (totalAssignments || []).length;
                  componentCountsMeta.codingAssignmentsAttemptedCount += (totalAssignments || []).filter((el) => get(el, 'code')).length;
                }
              }
              break;
            case 'blockBasedPractice':
              if (get(component, 'blockBasedProject.typeId')) {
                componentCountsMeta.practicesCount += 1;
              }
              if (classworkPracticeLog && classworkPracticeLog.length) {
                const newClassworkPracticeLog = sortBy([...classworkPracticeLog], 'mongoDocUpdatedAt').filter((practiceLog) => get(practiceLog, 'componentId') === get(component, 'blockBasedProject.typeId') && (practiceLog.eventType === 'update'));
                const latestPracticeLog = get(newClassworkPracticeLog[newClassworkPracticeLog.length - 1], 'recordRawDump', [])[0];
                if (latestPracticeLog) {
                  const isAttempted = get(latestPracticeLog, 'link') || get(latestPracticeLog, 'savedBlocks') || get(latestPracticeLog, 'attachments', []).length;
                  if (isAttempted) componentCountsMeta.practicesAttemptedCount += 1;
                }
              }
              break;
            default:
              break;
          }
        });
        const classworkComponentScores = getClassworkComponentScore(componentCountsMeta, learningObjectives);
        if (!isEqual(restObj, classworkComponentScores)) {
          await userSessionReportController.Model.update({ ...classworkComponentScores }, { where: { id } });
          console.log('Processed data ', updateIndex, ' out of ', userSessionReportsUpdated.length, batchIdIndex, batchIds.length);
          totalDocsUpdated += 1;
          updateIndex += 1;
        }
      }
    }
    batchIdIndex += 1;
  }
  console.log({ totalDocsUpdated });
};

export default updateComponentLogsInPGData;

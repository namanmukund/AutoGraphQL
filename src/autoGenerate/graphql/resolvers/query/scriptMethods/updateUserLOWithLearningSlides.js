/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable no-empty */
import { get } from 'lodash';
import { PUBLISHED } from '../../../../../../constants';
import getGoogleSpreadsheetData from '../../../../../../utils/getGoogleSpreadsheetData';
import { callLocalGraphqlApi } from '../../../../../api';

const updateUserLOWithLearningSlides = async (context) => {
  // Before running this please comment the userLearningObjective case in postHook
  const sheetDataRows = await getGoogleSpreadsheetData('1UWrfAgookeB6JvhsaNOaXHGtg_ydLSa_NZ-EBEv8Ics');
  const errorLogs = [];
  const totalLosToUpdate = [];
  for (const [index, row] of sheetDataRows.entries()) {
    try {
      console.log('Processing row number........', index + 2);
      const userLearningObjectivesRes = await callLocalGraphqlApi(`
      {
        userLearningObjectives(
            filter: {
                and: [
                    { learningObjective_some: { id: "${row.loId}" } }
                    {
                        user_some: {
                            studentProfile_some: { batch_some: { documentType: classroom } }
                        }
                    }
                ]
            }
        ) {
            id
            learningObjective {
              id
              learningSlides(filter:{status:${PUBLISHED}}, orderBy:order_ASC) {
                id
                type
                order
                practiceQuestions {
                  id
                }
              }
            }
            learningSlideStatus
            learningSlides {
              learningSlide {
                id
                type
                practiceQuestions {
                  id
                }
              }
              status
            }
            practiceQuestionStatus
            practiceQuestions {
              status
              question {
                id
              }
            }
        }
      }`, context);
      const userLearningObjectives = get(userLearningObjectivesRes, 'data.userLearningObjectives', []);
      if (userLearningObjectives && userLearningObjectives.length) {
        for (const userLearningObjective of userLearningObjectives) {
          const learningSlides = get(userLearningObjective, 'learningObjective.learningSlides', []);
          const userLearningObjectiveId = get(userLearningObjective, 'id');
          const userLearningSlides = get(userLearningObjective, 'learningSlides', []);
          const learningSlideStatus = get(userLearningObjective, 'learningSlideStatus', 'incomplete');
          const practiceQuestionStatus = get(userLearningObjective, 'practiceQuestionStatus', 'incomplete');
          const userPracticeQuestions = get(userLearningObjective, 'practiceQuestions', []);
          const inCompleteUserPracticeQuestions = userPracticeQuestions.filter((question) => get(question, 'status') === 'incomplete');
          let learningSlidesQuery = '';
          let learningSlideStatusValue = 'incomplete';
          if (!(inCompleteUserPracticeQuestions || []).length && practiceQuestionStatus === 'complete') {
            learningSlideStatusValue = 'complete';
          }
          if ((learningSlides || []).length && !(userLearningSlides || []).length) {
            learningSlidesQuery = '';
            learningSlides.forEach((learningSlide) => {
              const { id: learningSlideId } = learningSlide;
              learningSlidesQuery += `{ learningSlideConnectId: "${learningSlideId}", status: ${learningSlideStatusValue} }, `;
            });
            learningSlidesQuery += '';
            // if (learningSlidesQuery.trim()) {
            //   await callLocalGraphqlApi(`mutation {
            //   updateUserLearningObjective(
            //     id: "${userLearningObjectiveId}"
            //     input: { learningSlides: { replace: [${learningSlidesQuery}] },
            //     learningSlideStatus: ${learningSlideStatusValue} }
            //   ) {
            //     id
            //   }
            // }
            // `, context);
            // }
          }
          console.log({
            userLearningObjectiveId,
            learningSlides: learningSlides.length,
            userLearningSlides: userLearningSlides.length,
            learningSlideStatus,
            practiceQuestionStatus,
            userPracticeQuestions: userPracticeQuestions.length,
            inCompleteUserPracticeQuestions: inCompleteUserPracticeQuestions.length,
            learningSlidesQuery,
            learningSlideStatusValue,
          });
        }
        totalLosToUpdate.push(row.loId);
      }
    } catch (error) {
      errorLogs.push({
        sheetRow: index + 2,
        loId: row.loId,
        topicId: row.topicId,
        courseId: row.courseId,
        error: error.message,
      });
    }
  }
  console.log(totalLosToUpdate.length);
};

export default updateUserLOWithLearningSlides;

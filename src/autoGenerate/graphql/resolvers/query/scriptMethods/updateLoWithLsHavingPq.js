/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
import { get } from 'lodash';
import getGoogleSpreadsheetData from '../../../../../../utils/getGoogleSpreadsheetData';
import { callLocalGraphqlApi } from '../../../../../api';

const updateLoWithLsHavingPq = async (context) => {
  const sheetDataRows = await getGoogleSpreadsheetData('1UWrfAgookeB6JvhsaNOaXHGtg_ydLSa_NZ-EBEv8Ics');
  for (const [index, row] of sheetDataRows.entries()) {
    try {
      console.log('Processing row number........', index + 2);
      const { loId, topicId, courseId } = row;
      const learningObjectiveRes = await callLocalGraphqlApi(`{
        learningObjective(id: "${loId}") {
            id
            learningSlidesMeta {
            count
            }
            learningSlideWithPqMeta: learningSlidesMeta(
            filter: { type: practiceQuestion }
            ) {
            count
            }
            questionBank(filter: { status: published }, orderBy: order_ASC) {
            id
            }
        }
        }
        `, context);
      const learningSlidesMeta = get(learningObjectiveRes, 'data.learningObjective.learningSlidesMeta.count');
      const learningSlidesWithPqMeta = get(learningObjectiveRes, 'data.learningObjective.learningSlideWithPqMeta.count');
      const questionBanks = get(learningObjectiveRes, 'data.learningObjective.questionBank', []);
      if ((!learningSlidesMeta || !learningSlidesWithPqMeta) && questionBanks.length) {
        let addLsMutationStr = '';
        let indValue = 1;
        for (const question of questionBanks) {
          const questionId = get(question, 'id');
          addLsMutationStr += `questionId${indValue}: addLearningSlide(
                input: {
                layoutType: grid1X1
                name: "Question ${indValue}"
                order: ${indValue}
                status: published
                type: practiceQuestion
                }
                learningObjectivesConnectIds: ["${loId}"]
                practiceQuestionsConnectIds: ["${questionId}"]
                coursesConnectIds: ["${courseId}"]
                topicsConnectIds: ["${topicId}"]
            ) {
                id
            }`;
          indValue += 1;
        }
        console.log({ addLsMutationStr, questionBanks: questionBanks.length });
        // const lsRes = await callLocalGraphqlApi(`mutation {
        //     ${addLsMutationStr}
        //     }
        //     `, context);
        // console.log(JSON.stringify(lsRes));
      }
    } catch (err) {
      console.log({ err });
    }
  }
};

export default updateLoWithLsHavingPq;

import get from 'lodash/get';
import { AggregationBuilder } from 'mongodb-aggregation-builder';
import { EqualityPayload, OnlyPayload } from 'mongodb-aggregation-builder/helpers';
import { ArrayElemAt } from 'mongodb-aggregation-builder/operators';
import { QueryController } from '../../../controllers';
import { ifAuthorized } from '../../../../../../utils';

const getSubmittedAssignmentsStudents = async (
    roots,
    params,
    context,
) => {
    const { userIds, courseId, topicId } = params;
    const authentication = ifAuthorized(context);
    const userAssignmentModel = new QueryController('UserAssignment', authentication);
    const UserAssignmentPipeline = new AggregationBuilder('UserAssignment')
        .Project(OnlyPayload('id', 'user', 'assignment', 'topic', 'course'))
        .Match({ 'user.typeId': { $in: userIds }, 'topic.typeId': topicId, 'course.typeId': courseId })
        .Lookup(EqualityPayload('Evaluation', 'evaluations', 'assignment.evaluation.typeId', 'id'))
        .Lookup(EqualityPayload('AssignmentQuestion', 'questions', 'assignment.assignmentQuestion.typeId', 'id'))
        .getPipeline();
    const userAssignmentModelData = await userAssignmentModel.aggregate(UserAssignmentPipeline);
    const userAssignmentModelDataToSend = [];
    userAssignmentModelData && userAssignmentModelData.forEach((userAssignment) => {
        const obj = {
            id: get(userAssignment, 'id'),
            user: get(userAssignment, 'user'),
        };
        const assignments = [];
        const userAssingmentAssignments = get(userAssignment, 'assignment');
        const userAssingmentEvaluations = get(userAssignment, 'evaluations');
        const userAssingmentQuesitons = get(userAssignment, 'questions');
        userAssingmentAssignments && userAssingmentAssignments.forEach((assignment) => {
            if (get(assignment, 'userAnswerCodeSnippet', null) !== null && get(assignment, 'userAnswerCodeSnippet', null) !== 'null') {
                const evaluationToAdd = userAssingmentEvaluations && userAssingmentEvaluations.find((evaluation) => get(evaluation, 'id') === get(assignment, 'evaluation.typeId'));
                const questionToAdd = userAssingmentQuesitons && userAssingmentQuesitons.find((question) => get(question, 'id') === get(assignment, 'assignmentQuestion.typeId'));
                const assignmentObj = {
                    isAttempted: get(assignment, 'isAttempted'),
                    userAnswerCodeSnippet: get(assignment, 'userAnswerCodeSnippet'),
                };
                assignmentObj.evaluation = evaluationToAdd;
                assignmentObj.assignmentQuestion = questionToAdd;
                assignments.push(assignmentObj);
            }
        });
        if (assignments.length) {
            obj.assignment = assignments;
            userAssignmentModelDataToSend.push(obj);
        }
    });
    const userBlockBasedPracticeModel = new QueryController('UserBlockBasedPractice', authentication);
    const UserBlockBasedPracticePipeline = new AggregationBuilder('UserBlockBasedPractice')
        .Project(OnlyPayload('id', 'user', 'blockBasedPractice', 'evaluation', 'topic', 'course', 'answerLink', 'savedBlocks', 'attachments'))
        .Match({ 'user.typeId': { $in: userIds }, 'topic.typeId': topicId, 'course.typeId': courseId })
        .Lookup(EqualityPayload('Evaluation', 'evaluation', 'evaluation.typeId', 'id'))
        .Lookup(EqualityPayload('BlockBasedProject', 'blockBasedPractice', 'blockBasedPractice.typeId', 'id'))
        .Lookup(EqualityPayload('File', 'attachments', 'attachments.typeId', 'id'))
        .Project({
            ...OnlyPayload('id', 'user', 'topic', 'course', 'answerLink', 'savedBlocks', 'attachments'),
            blockBasedPractice: ArrayElemAt(['$blockBasedPractice', 0], 0),
            evaluation: ArrayElemAt(['$evaluation', 0], 0),
        })
        .getPipeline();
    const userBlockBasedPracticeModelData = await userBlockBasedPracticeModel.aggregate(UserBlockBasedPracticePipeline);
    const userBlockBasedPracticeModelDataFiltered = userBlockBasedPracticeModelData && userBlockBasedPracticeModelData.filter((userBlockBasedData) => (get(userBlockBasedData, 'answerLink', null) !== null || get(userBlockBasedData, 'attachments', []).length));
    const userBlockBasedPracticeDataToSend = [];
    userBlockBasedPracticeModelDataFiltered && userBlockBasedPracticeModelDataFiltered.forEach((practice) => {
        const obj = {
            id: get(practice, 'id'),
            user: get(practice, 'user'),
            topic: get(practice, 'topic'),
            course: get(practice, 'course'),
            blockBasedPractice: get(practice, 'blockBasedPractice[0]', {}),
            evaluation: get(practice, 'evaluation[0]', {}),
            attachments: get(practice, 'attachments', {}),
            answerLink: get(practice, 'answerLink'),
        };
        userBlockBasedPracticeDataToSend.push(obj);
    });
    return {
        userAssignment: userAssignmentModelDataToSend,
        blockBasedPracitce: userBlockBasedPracticeDataToSend,
    };
};

export default getSubmittedAssignmentsStudents;

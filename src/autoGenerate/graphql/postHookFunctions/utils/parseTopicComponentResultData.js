const parseTopicComponentResultData = (result, page) => {
  const parsedData = result;
  let topic;
  let video;
  let learningObjective;
  const practiceQuestions = [];
  let practiceQuestionsRes;
  const quiz = [];
  let quizRes;
  const assignment = [];
  let assignmentRes;
  switch (page) {
    case 'learningObjective':
      learningObjective = { type: 'LearningObjective', typeId: `${parsedData.learningObjective.id}` };
      parsedData.learningObjective = learningObjective;
      practiceQuestionsRes = parsedData.practiceQuestions;
      // parsing practice questions to be returned first time
      if (practiceQuestionsRes) {
        practiceQuestionsRes.forEach((practiceQuestion) => {
          const question = {
            question: {
              type: 'QuestionBank',
              typeId: `${practiceQuestion.question.id}`,
            },
            status: practiceQuestion.status,
            isHintUsed: practiceQuestion.isHintUsed,
            isAnswerUsed: practiceQuestion.isAnswerUsed,
            attemptNumber: practiceQuestion.attemptNumber,
          };
          practiceQuestions.push(question);
        });
      }
      parsedData.practiceQuestions = practiceQuestions;
      break;
    case 'quiz':
      topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
      parsedData.topic = topic;
      // constructing data for quiz whenever userQuiz document is just created
      quizRes = parsedData.quiz;
      // parsing quiz questions to be returned
      if (quizRes) {
        quizRes.forEach((quizQuestion) => {
          const question = {
            question: {
              type: 'QuestionBank',
              typeId: `${quizQuestion.question.id}`,
            },
            questionDisplayOrder: `${quizQuestion.questionDisplayOrder}`,
          };
          quiz.push(question);
        });
      }
      parsedData.quiz = quiz;
      break;
    case 'video':
      topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
      parsedData.topic = topic;
      if (parsedData.video && parsedData.video.id) {
        video = { type: 'Video', typeId: `${parsedData.video.id}` };
        parsedData.video = video;
      }
      break;
    case 'assignment':
      topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
      parsedData.topic = topic;
      // constructing data for assignment whenever userAssignment document is just created
      assignmentRes = parsedData.assignment;
      // parsing assignment questions to be returned
      if (assignmentRes) {
        assignmentRes.forEach((assignmentQuestion) => {
          const question = {
            assignmentQuestion: {
              type: 'AssignmentQuestion',
              typeId: `${assignmentQuestion.assignmentQuestion.id}`,
            },
            assignmentQuestionDisplayOrder: `${assignmentQuestion.assignmentQuestionDisplayOrder}`,
          };
          assignment.push(question);
        });
      }
      parsedData.assignment = assignment;
      break;
    default:
  }

  // Common data to be parsed for all topic components
  const user = { type: 'User', typeId: `${parsedData.user.id}` };
  // constructing data for next component whenever userLearningObjective document is created
  if (parsedData.nextComponent) {
    const nextComponent = {
      nextComponentType: `${parsedData.nextComponent.nextComponentType}`,
    };
    if (parsedData.nextComponent.learningObjective) {
      nextComponent.learningObjective = {
        type: 'LearningObjective', typeId: `${parsedData.nextComponent.learningObjective.id}`,
      };
    }
    if (parsedData.nextComponent.topic) {
      nextComponent.topic = {
        type: 'Topic', typeId: `${parsedData.nextComponent.topic.id}`,
      };
    }
    parsedData.nextComponent = nextComponent;
  }
  parsedData.user = user;
  return parsedData;
};

export default parseTopicComponentResultData;

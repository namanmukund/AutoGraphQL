const parseTopicComponentResultData = (result, page) => {
  const parsedData = result;
  let topic;
  let learningObjective;
  const quiz = [];
  let quizRes;
  switch (page) {
    case 'learningObjective':
      learningObjective = { type: 'LearningObjective', typeId: `${parsedData.learningObjective.id}` };
      parsedData.learningObjective = learningObjective;
      break;
    case 'quiz':
      topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
      parsedData.topic = topic;
      // constructing data for quiz whenever userQuiz document is just created
      quizRes = parsedData.quiz;
      if (quizRes) {
        quizRes.forEach((quizQuestion) => {
          const question = { question: { type: 'QuestionBank',
            typeId: `${quizQuestion.question.id}` },
          questionDisplayOrder: `${quizQuestion.questionDisplayOrder}` };
          quiz.push(question);
        });
      }
      parsedData.quiz = quiz;
      break;
    case 'video':
      topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
      parsedData.topic = topic;
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


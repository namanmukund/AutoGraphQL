const parseTopicComponentResultData = (result, page) => {
  const parsedData = result;
  if (page === 'learningObjective') {
    const lo = { type: 'LearningObjective', typeId: `${parsedData.learningObjective.id}` };
    parsedData.learningObjective = lo;
  } else if (page === 'quiz') {
    const topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
    parsedData.topic = topic;
    const quiz = [];
    // constructing data for quiz whenever userQuiz document is just created
    const quizRes = parsedData.quiz;
    if (quizRes) {
      quizRes.forEach((quizQuestion) => {
        const question = { question: { type: 'QuestionBank',
          typeId: `${quizQuestion.question.id}` },
        questionDisplayOrder: `${quizQuestion.questionDisplayOrder}` };
        quiz.push(question);
      });
    }
    parsedData.quiz = quiz;
  } else if (page === 'video') {
    const topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
    parsedData.topic = topic;
  }


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


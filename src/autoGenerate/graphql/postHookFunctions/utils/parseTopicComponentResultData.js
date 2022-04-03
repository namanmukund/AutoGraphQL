const parseTopicComponentResultData = (result, page) => {
  const parsedData = result;
  let topic;
  let video;
  let blockBasedProject;
  let blockBasedPractice;
  let learningObjective;
  const practiceQuestions = [];
  let practiceQuestionsRes;
  let learningSlidesRes;
  const learningSlides = [];
  const quiz = [];
  let quizRes;
  const assignment = [];
  let assignmentRes;
  switch (page) {
    case 'learningObjective':
      learningObjective = { type: 'LearningObjective', typeId: `${parsedData.learningObjective.id}` };
      parsedData.learningObjective = learningObjective;
      practiceQuestionsRes = parsedData.practiceQuestions;
      learningSlidesRes = parsedData.learningSlides;
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
      if (learningSlidesRes) {
        learningSlidesRes.forEach((slide) => {
          const learningSlideObj = {
            learningSlide: {
              type: 'LearningSlide',
              typeId: `${slide.learningSlide.id}`,
            },
            status: slide.status,
          };
          learningSlides.push(learningSlideObj);
        });
      }
      parsedData.learningSlides = learningSlides;
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
    case 'blockBasedProject':
      topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
      parsedData.topic = topic;
      if (parsedData.blockBasedProject && parsedData.blockBasedProject.id) {
        blockBasedProject = { type: 'BlockBasedProject', typeId: `${parsedData.blockBasedProject.id}` };
        parsedData.blockBasedProject = blockBasedProject;
      }
      break;
    case 'blockBasedPractice':
      topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
      parsedData.topic = topic;
      if (parsedData.blockBasedPractice && parsedData.blockBasedPractice.id) {
        blockBasedPractice = { type: 'BlockBasedProject', typeId: `${parsedData.blockBasedPractice.id}` };
        parsedData.blockBasedPractice = blockBasedPractice;
      }
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

import { PUBLISHED } from '../../../../../constants';

const topicComponentRuleQuery = `topicComponentRule{
  componentName
  order
  childComponentName
  learningObjectiveComponentsRule {
    componentName
    order
  }
  learningObjective{
    id
    order
    learningSlides(filter:{status:${PUBLISHED}}){
      id
    }
    messagesMeta{
      count
    }
    questionBankMeta(filter:{and:[{assessmentType:practiceQuestion}{status:${PUBLISHED}}]}){
      count
    }
    comicStripsMeta(filter:{status:${PUBLISHED}}){
      count
    }
    learningSlidesMeta(filter:{status:${PUBLISHED}}){
      count
    }
  }
  blockBasedProject{
    id
    order
  }
  video{
    id
  }
}`;

export default topicComponentRuleQuery;

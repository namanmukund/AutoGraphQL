import { PUBLISHED } from '../../../../../constants';

const topicComponentRuleQuery = `topicComponentRule{
  componentName
  order
  childComponentName
  learningObjective{
    id
    order
    messagesMeta{
      count
    }
    questionBankMeta(filter:{and:[{assessmentType:practiceQuestion}{status:${PUBLISHED}}]}){
      count
    }
    comicStripsMeta(filter:{status:${PUBLISHED}}){
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

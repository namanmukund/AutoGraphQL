/* eslint-disable dot-notation */
import { get } from 'lodash';
import moment from 'moment';
// import { auditQuestionType } from '../../../../../../constants';
// import { log } from '../../../../../../utils';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

// const {
//   mcq, bool, input, rating,
// } = auditQuestionType;

const fetchgenerateAuditReport = async () => {
  const query = `{
  mentorMenteeSessionAudits(
    filter: {
      and: [
        { status: completed }
        {
          auditCompletedOn_gte: "Sun Dec 26 2021 00:00:00 GMT+0530 (India Standard Time)"
        }
        {
          auditCompletedOn_lte: "Mon Jan 03 2022 23:59:59 GMT+0530 (India Standard Time)"
        }
      ]
    }
  ) {
    auditCompletedOn
    auditor {
      name
    }
    mentorMenteeSession {
      topic {
        order
      }
      sessionRecordingLink
      mentorSession {
        user {
          name
        }
      }
    }
    customScore
    totalScore
    score
    customSectionScore {
      customScore
      questionSection {
        id
        title
      }
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.mentorMenteeSessionAudits', []);
};

const generateAuditReport = async () => {
  const mentorMenteeSessionAudits = await fetchgenerateAuditReport();
  const reportsArray = [];
  const auditSections = [];
  mentorMenteeSessionAudits.forEach((mmsAudit) => {
    get(mmsAudit, 'customSectionScore', []).forEach((section) => {
      if (get(section, 'questionSection.title') && !auditSections.includes(get(section, 'questionSection.title'))) {
        auditSections.push(get(section, 'questionSection.title'));
      }
    });
  });
  mentorMenteeSessionAudits.forEach((mmsAudit, index) => {
    let mentorName = get(mmsAudit, 'mentorMenteeSession.mentorSession.user.name');
    let sessionRecordingLink = get(mmsAudit, 'mentorMenteeSession.sessionRecordingLink');
    let sessionType = '1:1`';
    if (get(mmsAudit, 'isBatchAudit', false)) {
      mentorName = get(mmsAudit, 'batchSession.mentorSession.user.name');
      sessionRecordingLink = get(mmsAudit, 'batchSession.sessionRecordingLink');
      topicOrder = get(mmsAudit, 'batchSession.topic.order', 0);
      sessionType = 'Batch';
    }
    const verticalType = 'B2C Demo';
    const auditObj = {};
    auditObj['##'] = index + 1;
    auditObj['Mentor Name'] = mentorName;
    auditObj['Auditor name'] = get(mmsAudit, 'auditor.name');
    auditObj['Session Link'] = sessionRecordingLink;
    auditObj['Vertical'] = verticalType;
    auditObj['Session Type'] = sessionType;
    auditSections.forEach((sec) => {
      const findSection = get(mmsAudit, 'customSectionScore', []).find((section) => get(section, 'questionSection.title') === sec);
      if (findSection && get(findSection, 'customScore')) {
        auditObj[get(findSection, 'questionSection.title')] = get(findSection, 'customScore');
      } else {
        auditObj[sec] = 0;
      }
    });
    auditObj['Custom Score'] = get(mmsAudit, 'customScore', 0);
    auditObj['Quality Score'] = get(mmsAudit, 'score', 0);
    auditObj['Total Score'] = get(mmsAudit, 'totalScore', 0);
    auditObj['Submitted At'] = moment(get(mmsAudit, 'auditCompletedOn')).format('MM/DD/YYYY HH:MM:SS');
    reportsArray.push(auditObj);
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(reportsArray));
};

export default generateAuditReport;

/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-confusing-arrow */

import {
  PDFDocument,
  PDFName,
  PDFString,
  rgb,
} from 'pdf-lib';
import * as fs from 'fs';
import fontkit from '@pdf-lib/fontkit';
import mkdirp from 'mkdirp';
import { get } from 'lodash';
import moment from 'moment';
import { GILROY_EXTRA_BOLD_FONT_URL, NUNITO_BOLD_FONT_URL } from '../../../../../../../constants';
import { uploadToS3 } from '../../../../../../middlewares/utils/uploadToS3';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';
import getStringWidth from '../utils/getStringWidthForEmbeddedFont';
import updateLeadSquared from '../../../../../../../services/leadsquared/updateLeadSquared';
import getUrlExtension from '../utils/getUrlExtension';

const capitalize = (str, lower = false) => (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) => match.toUpperCase());

const slugifyID = (ID) => ID ? ID.toString().trim().toUpperCase().replace(/\w{5}(?=.)/g, '$&-') : '';

const round = (score) => {
  if (score < 75) {
    return 70;
  } if (score < 85) {
    return 80;
  } if (score < 100) {
    return 90;
  }
  return 100;
};

const getDialParams = (score) => {
  const dialOffset = {
    score70: {
      x: -7,
      y: -5,
    },
    score80: {
      x: -10,
      y: -7,
    },
    score90: {
      x: -10,
      y: -7,
    },
    score100: {
      x: -10,
      y: -7,
    },
  };
  const roundedScore = round(score);
  return {
    dialX: dialOffset[`score${roundedScore}`].x,
    dialY: dialOffset[`score${roundedScore}`].y,
    dialUrl: `${process.env.FILE_BASE_URL}/python/course/iqaScores/score${roundedScore}.png`,
  };
};

const round5 = (x) => Math.round(x / 5) * 5;

const getMentorRatingStars = (rating) => `${process.env.FILE_BASE_URL}/python/course/mentorRatings/${rating}starHighRes.png`;

const getMentorDialUrl = (score) => `${process.env.FILE_BASE_URL}/python/course/ratingsDial/rating${Math.ceil(score)}HighRes.png`;

const iqaReportQuery = (id) => `{
iqaReports(filter: {
  and: [
    {
      user_some: {
        id: "${id}"
      }
    }
  ]
}, orderBy:createdAt_DESC){
    id
    iqaRank
    iqaScore
    globalRank
    maximumScore
    user{
      id
      name
      studentProfile{
        grade
        parents{
          user{
            name
            phone{
              number
            }
          }
        }
      }
    }
  }
}`;

const salesOperationQuery = (userId) => `
{
  salesOperations(filter:{
    client_some:{id:"${userId}"}
  }){
    client{
      name
      studentProfile{
        parents{
          user{
            name
            phone{
              number
            }
          }
        }
      }
    }
    criticalThinking
    logicalThinking
    communicationSkills
    problemSolvingAbility
    creativeSkills
    studentNote
    otherReasonsComment
    iqaTags{
      value
    }
    allottedMentor{
      name
      mentorProfile{
        codingLanguages{
          value
        }
        experienceYear
        pythonCourseRating1
      }
    }
  }
}
`;

const mentorMenteeSessionsQuery = (userId) => `
{
  mentorMenteeSessions(filter:{
    and:[
      {menteeSession_some:{
        user_some:{id: "${userId}"}
      }}
      {topic_some:{order: 1}}
    ]
  }){
    menteeSession{
      user{
        name
        studentProfile{
          parents{
            user{
              name
              phone{
                number
              }
            }
          }
        }
      }
    }
    mentorSession{
      user{
        id
        name
        profilePic{
          uri
        }
        mentorProfile{
          codingLanguages{
          value
        }
        experienceYear
        pythonCourseRating1
        }
      }
    }
  }
}
`;

const getGradeToDisplay = (grade) => {
  const numerical = grade.split('Grade')[1];
  let output = numerical;
  switch (numerical) {
    case '1':
      output += 'ST';
      break;
    case '2':
      output += 'ND';
      break;
    case '3':
      output += 'RD';
      break;
    default:
      output += 'TH';
      break;
  }
  return output;
};

const getNote = (key) => {
  switch (key) {
    case 'smartAndAttentive':
      return {
        line1: 'The student is very smart & attentive and understood the',
        line2: 'clearly. Also, the kid tried answering all the question',
        line3: 'and was very curious. Overall the kid has great potential.',
      };
    case 'interestedAndEagerToLearn':
      return {
        line1: 'The student was really interested in coding and was eager',
        line2: 'to learn as well. Also, the student was asking questions constantly.',
      };
    case 'goodCommunicationAndCurious':
      return {
        line1: 'The student is an extrovert and has amazing communication',
        line2: 'skills, also the kid was able to quickly grasp the concepts',
        line3: 'and had a lot of curiosity to learn more. The kid has great',
        line4: 'potential overall.',
      };
    case 'interactiveAndFocused':
      return {
        line1: 'The student was good at catching concepts and was really',
        line2: 'interactive and focused throughout the sessions and was',
        line3: 'very interested to learn coding.',
      };
    case 'problemSolvingAndCreativeThinkingSkill':
      return {
        line1: 'The student was really curious and filled with tons of',
        line2: 'energy also, had good problem-solving skills and creative',
        line3: 'thinking. Amazing kid!',
      };
    default:
      return {
        line1: 'The student was really interested in coding and was eager',
        line2: 'to learn as well. Also, the student was asking questions constantly.',
      };
  }
};

const getIqaTags = async (iqaTags, pdfDoc) => {
  let tags = [];
  const arr = [];
  if (iqaTags && iqaTags.length) {
    for (const iqaTag of iqaTags) {
      tags.push(iqaTag.value);
    }
  } else {
    tags = ['curious', 'focused', 'ambitious'];
  }
  const tag1Url = `${process.env.FILE_BASE_URL}/python/course/childTags/${tags[0]}.png`;
  const tag1Bytes = await fetch(tag1Url).then((res) => res.buffer());
  const tag1Image = await pdfDoc.embedPng(tag1Bytes);
  const tag1ImageDim = tag1Image.scale(1);
  arr.push({
    image: tag1Image,
    size: tag1ImageDim,
  });
  const tag2Url = `${process.env.FILE_BASE_URL}/python/course/childTags/${tags[1]}.png`;
  const tag2Bytes = await fetch(tag2Url).then((res) => res.buffer());
  const tag2Image = await pdfDoc.embedPng(tag2Bytes);
  const tag2ImageDim = tag2Image.scale(1);
  arr.push({
    image: tag2Image,
    size: tag2ImageDim,
  });
  const tag3Url = `${process.env.FILE_BASE_URL}/python/course/childTags/${tags[2]}.png`;
  const tag3Bytes = await fetch(tag3Url).then((res) => res.buffer());
  const tag3Image = await pdfDoc.embedPng(tag3Bytes);
  const tag3ImageDim = tag3Image.scale(1);
  arr.push({
    image: tag3Image,
    size: tag3ImageDim,
  });
  return arr;
};

const getPostDemoSalesReportUrl = async (userId) => {
  const iqaReports = get(await callLocalGraphqlApi(iqaReportQuery(userId)), 'data.iqaReports', []);
  let url = '';
  let existingPdfBytes = null;
  let pdfDoc = null;
  // fetch mentorMenteeSessionAudit for the given userId
  // fetch the audit report feilds for the various star ratings

  const salesOperations = get(await callLocalGraphqlApi(salesOperationQuery(userId)), 'data.salesOperations', []);
  const mentorNote = getNote(get(salesOperations, '[0].studentNote', 'smartAndAttentive'));
  const {
    criticalThinking = 4,
    logicalThinking = 5,
    communicationSkills = 4,
    problemSolvingAbility = 5,
    creativeSkills = 5,
    iqaTags,
  } = get(salesOperations, '[0]');

  const mentorMenteeSessions = get(await callLocalGraphqlApi(mentorMenteeSessionsQuery(userId)), 'data.mentorMenteeSessions', []);
  const mentorName = get(mentorMenteeSessions, '[0].mentorSession.user.name', '-');
  const mentorPicUri = get(mentorMenteeSessions, '[0].mentorSession.user.profilePic.uri', 'python/course/mentorAvatar.png');
  const parentPhone = get(mentorMenteeSessions, '[0].menteeSession.user.studentProfile.parents[0].user.phone.number', 'xxxxxx');
  const grade = getGradeToDisplay(get(iqaReports, '[0].user.studentProfile.grade', 'xx'));
  const parentName = get(mentorMenteeSessions, '[0].menteeSession.user.studentProfile.parents[0].user.name', 'xxxxxx', '-');
  const experience = get(mentorMenteeSessions, '[0].mentorSession.user.experienceYear', 2);
  const mentorRating = get(mentorMenteeSessions, '[0].mentorSession.user.pythonCourseRating1', 5);
  const studentName = get(mentorMenteeSessions, '[0].menteeSession.user.name', 'xxxxxx', '');

  if ((iqaReports && iqaReports.length)) {
    url = `${process.env.FILE_BASE_URL}/python/course/postDemoPostTestCombined.pdf`;
    existingPdfBytes = await fetch(url).then((res) => res.buffer());
    // Load a PDFDocument from the existing PDF bytes
    pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
    // Get the first page of the document
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const secondPage = pages[1];
    const thirdPage = pages[2];
    const { width } = firstPage.getSize();
    // // Embed the Helvetica font
    const GilroyExtraBoldfontBytes = await fetch(GILROY_EXTRA_BOLD_FONT_URL).then((res) => res.buffer());
    const GilroyExtraBoldFont = await pdfDoc.embedFont(GilroyExtraBoldfontBytes);
    const NunitoBoldfontBytes = await fetch(NUNITO_BOLD_FONT_URL).then((res) => res.buffer());
    const NunitoBoldFont = await pdfDoc.embedFont(NunitoBoldfontBytes);

    const { dialX, dialY, dialUrl } = getDialParams(get(iqaReports, '[0].iqaScore', 70));
    const dialImageBytes = await fetch(dialUrl).then((res) => res.buffer());

    const dialImage = await pdfDoc.embedPng(dialImageBytes);
    const dialDims = dialImage.scale(1);

    const mentorRatingStarBytes = await fetch(getMentorRatingStars(Math.ceil(mentorRating))).then((res) => res.buffer());
    const mentorRatingStarImage = await pdfDoc.embedPng(mentorRatingStarBytes);
    const mentorRatingStarDim = mentorRatingStarImage.scale(1);

    const fileType = getUrlExtension(mentorPicUri);
    let mentorSilhoutteUrl = null;
    let mentorSilhoutteBytes = null;
    let mentorSilhoutte = null;
    if (fileType === 'png') {
      mentorSilhoutteUrl = `${process.env.FILE_BASE_URL}/${mentorPicUri}`;
      mentorSilhoutteBytes = await fetch(mentorSilhoutteUrl).then((res) => res.buffer());
      mentorSilhoutte = await pdfDoc.embedPng(mentorSilhoutteBytes);
    } else {
      mentorSilhoutteUrl = `${process.env.FILE_BASE_URL}/python/course/mentorAvatar.png`;
      mentorSilhoutteBytes = await fetch(mentorSilhoutteUrl).then((res) => res.buffer());
      mentorSilhoutte = await pdfDoc.embedPng(mentorSilhoutteBytes);
    }
    const mentorImageDims = mentorSilhoutte.scale(1);

    const ratingAverage = Math.ceil((criticalThinking + logicalThinking + communicationSkills + problemSolvingAbility + creativeSkills) / 5);
    // star 1 = critical thinking
    const Star1Bytes = await fetch(getMentorRatingStars(criticalThinking)).then((res) => res.buffer());
    const Star1Image = await pdfDoc.embedPng(Star1Bytes);
    const Star1Dim = Star1Image.scale(1);
    const Star2Bytes = await fetch(getMentorRatingStars(logicalThinking)).then((res) => res.buffer());
    const Star2Image = await pdfDoc.embedPng(Star2Bytes);
    const Star2Dim = Star2Image.scale(1);
    const Star3Bytes = await fetch(getMentorRatingStars(communicationSkills)).then((res) => res.buffer());
    const Star3Image = await pdfDoc.embedPng(Star3Bytes);
    const Star3Dim = Star3Image.scale(1);
    const Star4Bytes = await fetch(getMentorRatingStars(problemSolvingAbility)).then((res) => res.buffer());
    const Star4Image = await pdfDoc.embedPng(Star4Bytes);
    const Star4Dim = Star4Image.scale(1);
    const Star5Bytes = await fetch(getMentorRatingStars(creativeSkills)).then((res) => res.buffer());
    const Star5Image = await pdfDoc.embedPng(Star5Bytes);
    const Star5Dim = Star5Image.scale(1);

    const mentorRatingDialBytes = await fetch(getMentorDialUrl(ratingAverage)).then((res) => res.buffer());
    const mentorRatingDialImage = await pdfDoc.embedPng(mentorRatingDialBytes);
    const mentorRatingDialDim = mentorRatingDialImage.scale(1);
    const selectedTags = await getIqaTags(iqaTags, pdfDoc);
    /*
      FIRST PAGE
    */
    firstPage.drawText(`${capitalize(parentName)},`, {
      x: 100,
      y: 678,
      size: 15,
      font: NunitoBoldFont,
      color: rgb(0, 0.29, 0.678),
    });

    firstPage.drawText(`${capitalize(studentName)}.`, {
      x: 170,
      y: 623,
      size: 15,
      font: NunitoBoldFont,
      color: rgb(0, 0.29, 0.678),
    });

    /*
      SECOND PAGE
    */
    secondPage.drawText(`${get(iqaReports, '[0].iqaScore', 70) < 70 ? 70 : get(iqaReports, '[0].iqaScore', 70)}`, {
      x: 170,
      y: 640,
      size: 50,
      font: GilroyExtraBoldFont,
      color: rgb(0, 0.29, 0.678),
    });

    secondPage.drawText(`/${get(iqaReports, '[0].maximumScore', 100)}`, {
      x: 170,
      y: 610,
      size: 20,
      font: GilroyExtraBoldFont,
      color: rgb(0.522, 0.518, 0.518),
    });

    secondPage.drawText(`${get(iqaReports, '[0].iqaRank', 70)}`, {
      x: 415,
      y: 697,
      size: 20,
      font: NunitoBoldFont,
      color: rgb(0.314, 0.310, 0.310),
    });

    secondPage.drawText(`${get(iqaReports, '[0].globalRank', 70)}`, {
      x: 415,
      y: 609,
      size: 20,
      font: NunitoBoldFont,
      color: rgb(0.314, 0.310, 0.310),
    });

    // dial image
    secondPage.drawImage(dialImage, {
      x: 87 + dialX,
      y: 562 + dialY,
      width: dialDims.width,
      height: dialDims.height,
    });

    // child name
    secondPage.drawText(`${get(iqaReports, '[0].user.name', 'xxx').split(' ')[0].toUpperCase()}`, {
      x: 120,
      y: 488,
      size: 12,
      font: NunitoBoldFont,
      color: rgb(0.314, 0.310, 0.310),
    });

    // child grade
    secondPage.drawText(`${grade}`, {
      x: 233,
      y: 488,
      size: 12,
      font: NunitoBoldFont,
      color: rgb(0.314, 0.310, 0.310),
    });

    // assessment Date
    secondPage.drawText(`${moment(new Date()).format('DD-MM-YYYY')}`, {
      x: 315,
      y: 488,
      size: 12,
      font: NunitoBoldFont,
      color: rgb(0.314, 0.310, 0.310),
    });

    // experience in coding
    secondPage.drawText(`${experience}+ Years`, {
      x: 317,
      y: 360,
      size: 14,
      font: NunitoBoldFont,
      color: rgb(0, 0.29, 0.678),
    });

    // most common review
    secondPage.drawText(`${'Friendly & Dedicated'}`, {
      x: 317,
      y: 307,
      size: 14,
      font: NunitoBoldFont,
      color: rgb(0, 0.29, 0.678),
    });

    // Languages
    secondPage.drawText(`${'Java, Python'}`, {
      x: 317,
      y: 254,
      size: 14,
      font: NunitoBoldFont,
      color: rgb(0, 0.29, 0.678),
    });

    // languages familiar with
    secondPage.drawText(`${capitalize(mentorName)}`, {
      x: ((width - getStringWidth(`${capitalize(mentorName)}`)) / 4) + 40,
      y: 257,
      size: 14,
      font: NunitoBoldFont,
      color: rgb(0, 0.29, 0.678),
    });

    // mentor rating stars
    secondPage.drawImage(mentorRatingStarImage, {
      x: 155,
      y: 226,
      width: mentorRatingStarDim.width / 3,
      height: mentorRatingStarDim.height / 3,
    });

    // mentor circle
    secondPage.drawCircle({
      x: 200,
      y: 320,
      size: 40,
      color: rgb(0.969, 0.729, 0.290),
      opacity: 1,
    });

    secondPage.drawImage(mentorSilhoutte, {
      x: 180,
      y: 300,
      width: 40,
      height: 40,
    });
    /*
      THIRD PAGE
    */
    // mentor rating dial
    thirdPage.drawImage(mentorRatingDialImage, {
      x: 200,
      y: 825,
      width: mentorRatingDialDim.width / 3,
      height: mentorRatingDialDim.height / 3,
    });

    // critical thinking
    thirdPage.drawImage(Star1Image, {
      x: 335,
      y: 786,
      width: Star1Dim.width / 3,
      height: Star1Dim.height / 3,
    });

    // logical thinking
    thirdPage.drawImage(Star2Image, {
      x: 335,
      y: 753,
      width: Star2Dim.width / 3,
      height: Star2Dim.height / 3,
    });

    // communication skills
    thirdPage.drawImage(Star3Image, {
      x: 335,
      y: 720,
      width: Star3Dim.width / 3,
      height: Star3Dim.height / 3,
    });

    // problem solving ability
    thirdPage.drawImage(Star4Image, {
      x: 335,
      y: 687,
      width: Star4Dim.width / 3,
      height: Star4Dim.height / 3,
    });

    // creativity skills
    thirdPage.drawImage(Star5Image, {
      x: 335,
      y: 654,
      width: Star5Dim.width / 3,
      height: Star5Dim.height / 3,
    });

    /*
      student tags
    */
    thirdPage.drawImage(selectedTags[0].image, {
      x: 140,
      y: 490,
      width: selectedTags[0].size.width / 3,
      height: selectedTags[0].size.height / 3,
    });

    thirdPage.drawImage(selectedTags[1].image, {
      x: 250,
      y: 490,
      width: selectedTags[1].size.width / 3,
      height: selectedTags[1].size.height / 3,
    });

    thirdPage.drawImage(selectedTags[2].image, {
      x: 360,
      y: 490,
      width: selectedTags[2].size.width / 3,
      height: selectedTags[2].size.height / 3,
    });

    // notes from the mentor
    if (mentorNote.line1) {
      thirdPage.drawText(mentorNote.line1, {
        x: 42,
        y: 570,
        size: 11,
        font: NunitoBoldFont,
        color: rgb(0.31, 0.31, 0.31),
      });
    }

    if (mentorNote.line2) {
      thirdPage.drawText(mentorNote.line2, {
        x: 42,
        y: 554,
        size: 11,
        font: NunitoBoldFont,
        color: rgb(0.31, 0.31, 0.31),
      });
    }

    if (mentorNote.line3) {
      thirdPage.drawText(mentorNote.line3, {
        x: 42,
        y: 538,
        size: 11,
        font: NunitoBoldFont,
        color: rgb(0.31, 0.31, 0.31),
      });
    }

    if (mentorNote.line4) {
      thirdPage.drawText(mentorNote.line4, {
        x: 42,
        y: 522,
        size: 11,
        font: NunitoBoldFont,
        color: rgb(0.31, 0.31, 0.31),
      });
    }

    // mentor name
    thirdPage.drawText(capitalize(mentorName), {
      x: 412,
      y: 570,
      size: 11,
      font: NunitoBoldFont,
      color: rgb(0.31, 0.31, 0.31),
    });

    // link to whatsapp
    const whatsappLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [230, 215, 370, 250],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('http://tekie.app.link/sgnArKNfwdb'),
      },
    });
    const whatsappLinkAnnotationRef = pdfDoc.context.register(whatsappLinkAnnotation);

    // link to tel
    const telLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [230, 160, 370, 195],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('tel:+918047483415'),
      },
    });
    const telLinkAnnotationRef = pdfDoc.context.register(telLinkAnnotation);

    // link to facebook
    const fbLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [200, 105, 230, 135],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://www.facebook.com/Tekie.in/'),
      },
    });
    const fbLinkAnnotationRef = pdfDoc.context.register(fbLinkAnnotation);

    // link to instagram
    const igLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [255, 105, 285, 135],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://www.instagram.com/tekie.in/'),
      },
    });
    const igLinkAnnotationRef = pdfDoc.context.register(igLinkAnnotation);

    // link to linkedin
    const liLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [310, 105, 340, 135],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://www.linkedin.com/company/tekie'),
      },
    });
    const liLinkAnnotationRef = pdfDoc.context.register(liLinkAnnotation);

    // link to youtube
    const ytLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [365, 105, 395, 135],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://www.youtube.com/channel/UCCr7GPlTdZRXFEfveeuKcbg'),
      },
    });
    const ytLinkAnnotationRef = pdfDoc.context.register(ytLinkAnnotation);

    // link to terms
    const termsLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [200, 65, 245, 85],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://www.tekie.in/terms'),
      },
    });
    const termsLinkAnnotationRef = pdfDoc.context.register(termsLinkAnnotation);

    // link to tekie.in
    const tekiewebLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [270, 65, 330, 85],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://www.tekie.in/'),
      },
    });
    const tekiewebLinkAnnotationRef = pdfDoc.context.register(tekiewebLinkAnnotation);

    // link to unsibscribe
    const unsLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [350, 65, 395, 85],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://tekie.in/Unsubscribe'),
      },
    });
    const unsLinkAnnotationRef = pdfDoc.context.register(unsLinkAnnotation);
    thirdPage.node.set(PDFName.of('Annots'), pdfDoc.context.obj([whatsappLinkAnnotationRef, telLinkAnnotationRef, fbLinkAnnotationRef, igLinkAnnotationRef, liLinkAnnotationRef, ytLinkAnnotationRef, termsLinkAnnotationRef, tekiewebLinkAnnotationRef, unsLinkAnnotationRef]));
  } else {
    url = `${process.env.FILE_BASE_URL}/python/course/postDemoPreTestCombined.pdf`;
    existingPdfBytes = await fetch(url).then((res) => res.buffer());
    // Load a PDFDocument from the existing PDF bytes
    pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
    // Get the first page of the document
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const secondPage = pages[1];
    const { width } = firstPage.getSize();
    // // Embed the Helvetica font
    const GilroyExtraBoldfontBytes = await fetch(GILROY_EXTRA_BOLD_FONT_URL).then((res) => res.buffer());
    const GilroyExtraBoldFont = await pdfDoc.embedFont(GilroyExtraBoldfontBytes);
    const NunitoBoldfontBytes = await fetch(NUNITO_BOLD_FONT_URL).then((res) => res.buffer());
    const NunitoBoldFont = await pdfDoc.embedFont(NunitoBoldfontBytes);

    const ratingAverage = Math.ceil((criticalThinking + logicalThinking + communicationSkills + problemSolvingAbility + creativeSkills) / 5);
    // star 1 = critical thinking
    const Star1Bytes = await fetch(getMentorRatingStars(criticalThinking)).then((res) => res.buffer());
    const Star1Image = await pdfDoc.embedPng(Star1Bytes);
    const Star1Dim = Star1Image.scale(1);
    const Star2Bytes = await fetch(getMentorRatingStars(logicalThinking)).then((res) => res.buffer());
    const Star2Image = await pdfDoc.embedPng(Star2Bytes);
    const Star2Dim = Star2Image.scale(1);
    const Star3Bytes = await fetch(getMentorRatingStars(communicationSkills)).then((res) => res.buffer());
    const Star3Image = await pdfDoc.embedPng(Star3Bytes);
    const Star3Dim = Star3Image.scale(1);
    const Star4Bytes = await fetch(getMentorRatingStars(problemSolvingAbility)).then((res) => res.buffer());
    const Star4Image = await pdfDoc.embedPng(Star4Bytes);
    const Star4Dim = Star4Image.scale(1);
    const Star5Bytes = await fetch(getMentorRatingStars(creativeSkills)).then((res) => res.buffer());
    const Star5Image = await pdfDoc.embedPng(Star5Bytes);
    const Star5Dim = Star5Image.scale(1);

    const mentorRatingDialBytes = await fetch(getMentorDialUrl(ratingAverage)).then((res) => res.buffer());
    const mentorRatingDialImage = await pdfDoc.embedPng(mentorRatingDialBytes);
    const mentorRatingDialDim = mentorRatingDialImage.scale(1);
    const selectedTags = await getIqaTags(iqaTags, pdfDoc);
    /*
      FIRST PAGE
    */
    firstPage.drawText(`${capitalize(parentName)},`, {
      x: 100,
      y: 678,
      size: 15,
      font: NunitoBoldFont,
      color: rgb(0, 0.29, 0.678),
    });

    firstPage.drawText(`${capitalize(studentName)}.`, {
      x: 170,
      y: 623,
      size: 15,
      font: NunitoBoldFont,
      color: rgb(0, 0.29, 0.678),
    });
    /*
      SECOND PAGE
    */
    // mentor rating dial
    secondPage.drawImage(mentorRatingDialImage, {
      x: 200,
      y: 825,
      width: mentorRatingDialDim.width / 3,
      height: mentorRatingDialDim.height / 3,
    });

    // critical thinking
    secondPage.drawImage(Star1Image, {
      x: 335,
      y: 786,
      width: Star1Dim.width / 3,
      height: Star1Dim.height / 3,
    });

    // logical thinking
    secondPage.drawImage(Star2Image, {
      x: 335,
      y: 753,
      width: Star2Dim.width / 3,
      height: Star2Dim.height / 3,
    });

    // communication skills
    secondPage.drawImage(Star3Image, {
      x: 335,
      y: 720,
      width: Star3Dim.width / 3,
      height: Star3Dim.height / 3,
    });

    // problem solving ability
    secondPage.drawImage(Star4Image, {
      x: 335,
      y: 687,
      width: Star4Dim.width / 3,
      height: Star4Dim.height / 3,
    });

    // creativity skills
    secondPage.drawImage(Star5Image, {
      x: 335,
      y: 654,
      width: Star5Dim.width / 3,
      height: Star5Dim.height / 3,
    });

    /*
      student tags
    */
    secondPage.drawImage(selectedTags[0].image, {
      x: 140,
      y: 490,
      width: selectedTags[0].size.width / 3,
      height: selectedTags[0].size.height / 3,
    });

    secondPage.drawImage(selectedTags[1].image, {
      x: 250,
      y: 490,
      width: selectedTags[1].size.width / 3,
      height: selectedTags[1].size.height / 3,
    });

    secondPage.drawImage(selectedTags[2].image, {
      x: 360,
      y: 490,
      width: selectedTags[2].size.width / 3,
      height: selectedTags[2].size.height / 3,
    });

    // notes from the mentor
    if (mentorNote.line1) {
      secondPage.drawText(mentorNote.line1, {
        x: 42,
        y: 570,
        size: 11,
        font: NunitoBoldFont,
        color: rgb(0.31, 0.31, 0.31),
      });
    }

    if (mentorNote.line2) {
      secondPage.drawText(mentorNote.line2, {
        x: 42,
        y: 554,
        size: 11,
        font: NunitoBoldFont,
        color: rgb(0.31, 0.31, 0.31),
      });
    }

    if (mentorNote.line3) {
      secondPage.drawText(mentorNote.line3, {
        x: 42,
        y: 538,
        size: 11,
        font: NunitoBoldFont,
        color: rgb(0.31, 0.31, 0.31),
      });
    }

    if (mentorNote.line4) {
      secondPage.drawText(mentorNote.line4, {
        x: 42,
        y: 522,
        size: 11,
        font: NunitoBoldFont,
        color: rgb(0.31, 0.31, 0.31),
      });
    }

    // mentor name
    secondPage.drawText(capitalize(mentorName), {
      x: 412,
      y: 570,
      size: 11,
      font: NunitoBoldFont,
      color: rgb(0.31, 0.31, 0.31),
    });

    // link to whatsapp
    const whatsappLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [230, 215, 370, 250],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('http://tekie.app.link/sgnArKNfwdb'),
      },
    });
    const whatsappLinkAnnotationRef = pdfDoc.context.register(whatsappLinkAnnotation);

    // link to tel
    const telLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [230, 160, 370, 195],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('tel:+918047483415'),
      },
    });
    const telLinkAnnotationRef = pdfDoc.context.register(telLinkAnnotation);

    // link to facebook
    const fbLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [200, 105, 230, 135],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://www.facebook.com/Tekie.in/'),
      },
    });
    const fbLinkAnnotationRef = pdfDoc.context.register(fbLinkAnnotation);

    // link to instagram
    const igLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [255, 105, 285, 135],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://www.instagram.com/tekie.in/'),
      },
    });
    const igLinkAnnotationRef = pdfDoc.context.register(igLinkAnnotation);

    // link to linkedin
    const liLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [310, 105, 340, 135],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://www.linkedin.com/company/tekie'),
      },
    });
    const liLinkAnnotationRef = pdfDoc.context.register(liLinkAnnotation);

    // link to youtube
    const ytLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [365, 105, 395, 135],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://www.youtube.com/channel/UCCr7GPlTdZRXFEfveeuKcbg'),
      },
    });
    const ytLinkAnnotationRef = pdfDoc.context.register(ytLinkAnnotation);

    // link to terms
    const termsLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [200, 65, 245, 85],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://www.tekie.in/terms'),
      },
    });
    const termsLinkAnnotationRef = pdfDoc.context.register(termsLinkAnnotation);

    // link to tekie.in
    const tekiewebLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [270, 65, 330, 85],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://www.tekie.in/'),
      },
    });
    const tekiewebLinkAnnotationRef = pdfDoc.context.register(tekiewebLinkAnnotation);

    // link to unsibscribe
    const unsLinkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [350, 65, 395, 85],
      Border: [0, 0, 0],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://tekie.in/Unsubscribe'),
      },
    });
    const unsLinkAnnotationRef = pdfDoc.context.register(unsLinkAnnotation);
    secondPage.node.set(PDFName.of('Annots'), pdfDoc.context.obj([whatsappLinkAnnotationRef, telLinkAnnotationRef, fbLinkAnnotationRef, igLinkAnnotationRef, liLinkAnnotationRef, ytLinkAnnotationRef, termsLinkAnnotationRef, tekiewebLinkAnnotationRef, unsLinkAnnotationRef]));
  }
  /** PDF Meta Details */
  pdfDoc.setAuthor('Tekie');
  pdfDoc.setCreator('Kiwhode Learning Pvt Ltd');
  pdfDoc.setSubject('Tekie\'s Demo Report');
  pdfDoc.setTitle('Tekie\'s Demo Report');
  pdfDoc.setProducer('Tekie.in');

  const pdfBytes = await pdfDoc.save();
  const path = '/tmp/postdemo/certificate-pdf.pdf';
  mkdirp.sync('/tmp/postdemo');
  fs.writeFileSync(path, pdfBytes);
  const fileContent = fs.readFileSync(path);
  let fetchedUrl = '';
  if (fileContent) {
    const key = `event-certificate/postdemo/${slugifyID(userId)}-certificate.pdf`;
    await uploadToS3(key, fileContent);
    fetchedUrl = key;
  }
  // send the newly generated url as lead capture
  updateLeadSquared({
    Phone: parentPhone,
    mx_IQA_Test_Report: `${process.env.FILE_BASE_URL}/${fetchedUrl}`,
  }, false);

  return fetchedUrl;
};

export default getPostDemoSalesReportUrl;

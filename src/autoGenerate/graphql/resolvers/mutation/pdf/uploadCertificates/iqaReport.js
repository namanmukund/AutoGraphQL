/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-confusing-arrow */

import {
  PDFDocument, PDFName, PDFString,
  rgb,
} from 'pdf-lib';
import * as fs from 'fs';
import moment from 'moment';
import fontkit from '@pdf-lib/fontkit';
import mkdirp from 'mkdirp';
import { get } from 'lodash';
import { GILROY_EXTRA_BOLD_FONT_URL, NUNITO_BOLD_FONT_URL } from '../../../../../../../constants';
import { uploadToS3 } from '../../../../../../middlewares/utils/uploadToS3';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';
import getStringWidth from '../utils/getStringWidthForEmbeddedFont';
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
      x: -2,
      y: -7,
    },
    score80: {
      x: -4,
      y: -7,
    },
    score90: {
      x: -4,
      y: -7,
    },
    score100: {
      x: -4,
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

const getMentorRatingStars = (rating) => `${process.env.FILE_BASE_URL}/python/course/mentorRatings/${rating}star.png`;

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

const getIqaReportSnapshotUrl = async (userId, userName) => {
  const iqaReports = get(await callLocalGraphqlApi(iqaReportQuery(userId)), 'data.iqaReports', []);
  const url = `${process.env.FILE_BASE_URL}/python/course/iqaReportCompressed.pdf`;
  const existingPdfBytes = await fetch(url).then((res) => res.buffer());
  // Load a PDFDocument from the existing PDF bytes
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit);

  const mentorMenteeSessions = get(await callLocalGraphqlApi(mentorMenteeSessionsQuery(userId)), 'data.mentorMenteeSessions', []);
  const mentorName = get(mentorMenteeSessions, '[0].mentorSession.user.name', '-');
  const mentorPicUri = get(mentorMenteeSessions, '[0].mentorSession.user.profilePic.uri', 'python/course/mentorAvatar.png');
  const parentPhone = get(iqaReports, '[0].user.studentProfile.parents[0].user.phone.number', 'xxxxxx');
  const grade = getGradeToDisplay(get(iqaReports, '[0].user.studentProfile.grade', 'xx'));
  const parentName = get(iqaReports, '[0].user.studentProfile.parents[0].user.name', '-');
  const experience = get(mentorMenteeSessions, '[0].mentorSession.user.experienceYear', 2);
  const mentorRating = get(mentorMenteeSessions, '[0].mentorSession.user.pythonCourseRating1', 5);

  // Get the first page of the document
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
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

  const mentorRatingStarBytes = await fetch(getMentorRatingStars(mentorRating)).then((res) => res.buffer());

  const mentorRatingStarImage = await pdfDoc.embedPng(mentorRatingStarBytes);
  const mentorRatingStarDim = mentorRatingStarImage.scale(1);

  firstPage.drawText(`${capitalize(get(iqaReports, '[0].user.name', ''))}'s IQA Report`, {
    x: (width - getStringWidth(`${capitalize(get(iqaReports, '[0].user.name', ''))}'s IQA Report`)) / 2,
    y: 1122,
    size: 24,
    font: NunitoBoldFont,
    color: rgb(0, 0.29, 0.678),
  });

  firstPage.drawText(`Dear ${capitalize(parentName)},`, {
    x: ((width - getStringWidth(`Dear ${capitalize(parentName)},`)) / 2) + 15,
    y: 1240,
    size: 16,
    font: NunitoBoldFont,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText(`${get(iqaReports, '[0].iqaScore', 70) < 70 ? 70 : get(iqaReports, '[0].iqaScore', 70)}`, {
    x: 170,
    y: 940,
    size: 50,
    font: GilroyExtraBoldFont,
    color: rgb(0, 0.29, 0.678),
  });

  firstPage.drawText(`/${get(iqaReports, '[0].maximumScore', 100)}`, {
    x: 170,
    y: 910,
    size: 20,
    font: GilroyExtraBoldFont,
    color: rgb(0.522, 0.518, 0.518),
  });

  firstPage.drawText(`${get(iqaReports, '[0].iqaRank', 70)}`, {
    x: 415,
    y: 997,
    size: 20,
    font: NunitoBoldFont,
    color: rgb(0.314, 0.310, 0.310),
  });

  firstPage.drawText(`${get(iqaReports, '[0].globalRank', 70)}`, {
    x: 415,
    y: 909,
    size: 20,
    font: NunitoBoldFont,
    color: rgb(0.314, 0.310, 0.310),
  });

  // dial image
  firstPage.drawImage(dialImage, {
    x: 87 + dialX,
    y: 862 + dialY,
    width: dialDims.width,
    height: dialDims.height,
  });

  // child name
  firstPage.drawText(`${get(iqaReports, '[0].user.name', 'xxx').split(' ')[0].toUpperCase()}`, {
    x: 126,
    y: 786,
    size: 12,
    font: NunitoBoldFont,
    color: rgb(0.314, 0.310, 0.310),
  });

  // child grade
  firstPage.drawText(`${grade}`, {
    x: 237,
    y: 786,
    size: 12,
    font: NunitoBoldFont,
    color: rgb(0.314, 0.310, 0.310),
  });

  // assessment Date
  firstPage.drawText(`${moment(new Date()).format('DD-MM-YYYY')}`, {
    x: 320,
    y: 786,
    size: 12,
    font: NunitoBoldFont,
    color: rgb(0.314, 0.310, 0.310),
  });

  // experience in coding
  firstPage.drawText(`${experience}+ Years`, {
    x: 317,
    y: 660,
    size: 14,
    font: NunitoBoldFont,
    color: rgb(0, 0.29, 0.678),
  });

  // most common review
  firstPage.drawText(`${'Friendly & Dedicated'}`, {
    x: 317,
    y: 607,
    size: 14,
    font: NunitoBoldFont,
    color: rgb(0, 0.29, 0.678),
  });

  // Languages
  firstPage.drawText(`${'Java, Python'}`, {
    x: 317,
    y: 554,
    size: 14,
    font: NunitoBoldFont,
    color: rgb(0, 0.29, 0.678),
  });

  // languages familiar with
  firstPage.drawText(`${capitalize(mentorName)}`, {
    x: ((width - getStringWidth(`${capitalize(mentorName)}`)) / 4) + 40,
    y: 557,
    size: 14,
    font: NunitoBoldFont,
    color: rgb(0, 0.29, 0.678),
  });

  // mentor rating stars
  firstPage.drawImage(mentorRatingStarImage, {
    x: 155,
    y: 526,
    width: mentorRatingStarDim.width,
    height: mentorRatingStarDim.height,
  });

  // mentor circle
  firstPage.drawCircle({
    x: 200,
    y: 620,
    size: 40,
    color: rgb(0.969, 0.729, 0.290),
    opacity: 1,
  });

  // mentor rating stars
  firstPage.drawImage(mentorSilhoutte, {
    x: 180,
    y: 600,
    width: 40,
    height: 40,
  });

  // in rect, first value is the positive x axis value, left side
  // second value is the positive y axis value, bottom side
  // third value is the positive x axis value, right side
  // fourth value is the positive y axis value, top side
  // Book counselling session CTA
  const linkAnnotation = pdfDoc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [199, 292, 388, 338],
    Border: [0, 0, 2],
    C: [0, 0, 1],
    A: {
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of(`https://lt5w9obz0m7.typeform.com/counsel-session#phone_number=${parentPhone}`),
    },
  });
  const linkAnnotationRef = pdfDoc.context.register(linkAnnotation);

  firstPage.drawText('Book My Counselling Session', {
    x: 229,
    y: 322,
    font: NunitoBoldFont,
    size: 12,
    color: rgb(1, 1, 1),
  });

  // link to whatsapp
  const whatsappLinkAnnotation = pdfDoc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [230, 165, 370, 200],
    Border: [0, 0, 1],
    C: [0, 0, 1],
    A: {
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of('http://tekie.app.link/sgnArKNfwdb'),
    },
  });
  const whatsappLinkAnnotationRef = pdfDoc.context.register(whatsappLinkAnnotation);

  // link to facebook
  const fbLinkAnnotation = pdfDoc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [200, 55, 230, 85],
    Border: [0, 0, 1],
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
    Rect: [255, 55, 285, 85],
    Border: [0, 0, 1],
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
    Rect: [310, 55, 340, 85],
    Border: [0, 0, 1],
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
    Rect: [365, 55, 395, 85],
    Border: [0, 0, 1],
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
    Rect: [200, 15, 245, 35],
    Border: [0, 0, 1],
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
    Rect: [270, 15, 330, 35],
    Border: [0, 0, 1],
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
    Rect: [350, 15, 395, 35],
    Border: [0, 0, 1],
    C: [0, 0, 1],
    A: {
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of('https://tekie.in/Unsubscribe'),
    },
  });
  const unsLinkAnnotationRef = pdfDoc.context.register(unsLinkAnnotation);
  firstPage.node.set(PDFName.of('Annots'), pdfDoc.context.obj([linkAnnotationRef, whatsappLinkAnnotationRef, fbLinkAnnotationRef, igLinkAnnotationRef, liLinkAnnotationRef, ytLinkAnnotationRef, termsLinkAnnotationRef, tekiewebLinkAnnotationRef, unsLinkAnnotationRef]));
  /** PDF Meta Details */
  pdfDoc.setAuthor('Tekie');
  pdfDoc.setCreator('Kiwhode Learning Pvt Ltd');
  pdfDoc.setSubject('Tekie\'s IQA Report');
  pdfDoc.setTitle('Tekie\'s IQA Report');
  pdfDoc.setProducer('Tekie.in');

  const pdfBytes = await pdfDoc.save();
  const path = '/tmp/iqareport/certificate-pdf.pdf';
  mkdirp.sync('/tmp/iqareport');
  fs.writeFileSync(path, pdfBytes);
  const fileContent = fs.readFileSync(path);
  let fetchedUrl = '';
  if (fileContent) {
    const key = `event-certificate/iqareport/${slugifyID(userId)}-certificate.pdf`;
    await uploadToS3(key, fileContent);
    fetchedUrl = key;
  }
  return fetchedUrl;
};

export default getIqaReportSnapshotUrl;

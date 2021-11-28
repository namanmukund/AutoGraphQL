/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-confusing-arrow */

import { PDFDocument, rgb } from 'pdf-lib';
import * as fs from 'fs';
import fontkit from '@pdf-lib/fontkit';
import mkdirp from 'mkdirp';
import { get } from 'lodash';
import { GILROY_EXTRA_BOLD_FONT_URL, NUNITO_BOLD_FONT_URL } from '../../../../../../../constants';
import { uploadToS3 } from '../../../../../../middlewares/utils/uploadToS3';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';
import getStringWidth from '../utils/getStringWidthForEmbeddedFont';
import updateLeadSquared from '../../../../../../../services/leadsquared/updateLeadSquared';

const capitalize = (str, lower = false) => (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) => match.toUpperCase());

const slugifyID = (ID) => ID ? ID.toString().trim().toUpperCase().replace(/\w{5}(?=.)/g, '$&-') : '';

const round5 = (x) => Math.round(x / 5) * 5;

const getDialUrl = (score) => `${process.env.FILE_BASE_URL}/python/course/iqaScores/score${round5(score)}.png`;

const getMentorDialUrl = (score) => `${process.env.FILE_BASE_URL}/python/course/ratingsDial/rating${round5(score)}.png`;

const getMentorRatingStars = (rating) => `${process.env.FILE_BASE_URL}/python/course/mentorRatings/${rating}star.png`;

const iqaReportQuery = (id) => `{
iqaReports(filter: {
  and: [
    {
      user_some: {
        id: "${id}"
      }
    }
  ]
} ){
    id
    iqaRank
    iqaScore
    globalRank
    maximumScore
    user{
      id
      name
      studentProfile{
        parents{
          user{
            name
          }
        }
      }
    }
  }
}`;

const getPostDemoSalesReportUrl = async (userId) => {
  const iqaReports = get(await callLocalGraphqlApi(iqaReportQuery(userId)), 'data.iqaReports', []);
  let url = '';
  let existingPdfBytes = null;
  let pdfDoc = null;
  // fetch mentorMenteeSessionAudit for the given userId
  // fetch the audit report feilds for the various star ratings
  const tagsArray = ['ENERGETIC', 'MOTIVATED', 'AMBITIOUS', 'CURIOUS'];
  const shuffledTags = tagsArray.sort(() => 0.5 - Math.random());
  const selectedTags = shuffledTags.slice(0, 3);

  const mentorNote = 'The child was very enthusiastic in the class.';
  const mentorName = 'Kavita Naresh';

  // fetch sales operation

  if ((iqaReports && iqaReports.length)) {
    url = `${process.env.FILE_BASE_URL}/python/course/postDemoPostTest.pdf`;
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

    const dialImageBytes = await fetch(getDialUrl(get(iqaReports, '[0].iqaScoree', 70))).then((res) => res.buffer());

    const dialImage = await pdfDoc.embedPng(dialImageBytes);
    const dialDims = dialImage.scale(1);

    const mentorRatingStarBytes = await fetch(getMentorRatingStars(5)).then((res) => res.buffer());
    const mentorRatingStarImage = await pdfDoc.embedPng(mentorRatingStarBytes);
    const mentorRatingStarDim = mentorRatingStarImage.scale(1);

    const mentorRatingDialBytes = await fetch(getMentorDialUrl(5)).then((res) => res.buffer());
    const mentorRatingDialImage = await pdfDoc.embedPng(mentorRatingDialBytes);
    const mentorRatingDialDim = mentorRatingDialImage.scale(1);

    const Star1Bytes = await fetch(getMentorRatingStars(1)).then((res) => res.buffer());
    const Star1Image = await pdfDoc.embedPng(Star1Bytes);
    const Star1Dim = Star1Image.scale(1);
    const Star2Bytes = await fetch(getMentorRatingStars(2)).then((res) => res.buffer());
    const Star2Image = await pdfDoc.embedPng(Star2Bytes);
    const Star2Dim = Star2Image.scale(1);
    const Star3Bytes = await fetch(getMentorRatingStars(3)).then((res) => res.buffer());
    const Star3Image = await pdfDoc.embedPng(Star3Bytes);
    const Star3Dim = Star3Image.scale(1);
    const Star4Bytes = await fetch(getMentorRatingStars(4)).then((res) => res.buffer());
    const Star4Image = await pdfDoc.embedPng(Star4Bytes);
    const Star4Dim = Star4Image.scale(1);
    const Star5Bytes = await fetch(getMentorRatingStars(5)).then((res) => res.buffer());
    const Star5Image = await pdfDoc.embedPng(Star5Bytes);
    const Star5Dim = Star5Image.scale(1);

    /*
      FIRST PAGE
    */
    firstPage.drawText(`${'Parent Name'},`, {
      x: 100,
      y: 678,
      size: 15,
      font: NunitoBoldFont,
      color: rgb(0, 0.29, 0.678),
    });

    firstPage.drawText(`${'Student Name'}.`, {
      x: 170,
      y: 623,
      size: 15,
      font: NunitoBoldFont,
      color: rgb(0, 0.29, 0.678),
    });

    /*
      SECOND PAGE
    */
    secondPage.drawText(`${get(iqaReports, '[0].iqaScore', 70)}`, {
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
      x: 87,
      y: 562,
      width: dialDims.width,
      height: dialDims.height,
    });

    secondPage.drawText(`${get(iqaReports, '[0].user.name', '').split(' ')[0].toUpperCase()}`, {
      x: 115,
      y: 490,
      size: 12,
      font: NunitoBoldFont,
      color: rgb(0.314, 0.310, 0.310),
    });

    secondPage.drawText(`${get(iqaReports, '[0].user.name', '').split(' ')[0].toUpperCase()}`, {
      x: 225,
      y: 490,
      size: 12,
      font: NunitoBoldFont,
      color: rgb(0.314, 0.310, 0.310),
    });

    secondPage.drawText(`${get(iqaReports, '[0].user.name', '').split(' ')[0].toUpperCase()}`, {
      x: 315,
      y: 490,
      size: 12,
      font: NunitoBoldFont,
      color: rgb(0.314, 0.310, 0.310),
    });

    // experience in coding
    secondPage.drawText(`${'3.5+ Years'}`, {
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
    secondPage.drawText(`${capitalize('Gokul Madhusudhan')}`, {
      x: ((width - getStringWidth(`${capitalize('Gokul Madhusudhan')}`)) / 4) + 40,
      y: 257,
      size: 14,
      font: NunitoBoldFont,
      color: rgb(0, 0.29, 0.678),
    });

    // mentor rating stars
    secondPage.drawImage(mentorRatingStarImage, {
      x: 155,
      y: 226,
      width: mentorRatingStarDim.width,
      height: mentorRatingStarDim.height,
    });

    // mentor circle
    secondPage.drawCircle({
      x: 200,
      y: 320,
      size: 40,
      color: rgb(0.969, 0.729, 0.290),
      opacity: 1,
    });
    /*
      THIRD PAGE
    */
    // mentor rating dial
    thirdPage.drawImage(mentorRatingDialImage, {
      x: 200,
      y: 800,
      width: mentorRatingDialDim.width,
      height: mentorRatingDialDim.height,
    });

    // critical thinking
    thirdPage.drawImage(Star1Image, {
      x: 335,
      y: 786,
      width: Star1Dim.width,
      height: Star1Dim.height,
    });

    // logical thinking
    thirdPage.drawImage(Star2Image, {
      x: 335,
      y: 753,
      width: Star2Dim.width,
      height: Star2Dim.height,
    });

    // communication skills
    thirdPage.drawImage(Star3Image, {
      x: 335,
      y: 720,
      width: Star3Dim.width,
      height: Star3Dim.height,
    });

    // problem solving ability
    thirdPage.drawImage(Star4Image, {
      x: 335,
      y: 687,
      width: Star4Dim.width,
      height: Star4Dim.height,
    });

    // creativity skills
    thirdPage.drawImage(Star5Image, {
      x: 335,
      y: 654,
      width: Star5Dim.width,
      height: Star5Dim.height,
    });

    /*
      student tags
    */
    thirdPage.drawText(selectedTags[0], {
      x: 146,
      y: 496,
      size: 11,
      font: NunitoBoldFont,
      color: rgb(0.09, 0.675, 1),
    });

    thirdPage.drawText(selectedTags[1], {
      x: 226,
      y: 496,
      size: 11,
      font: NunitoBoldFont,
      color: rgb(0.09, 0.675, 1),
    });

    thirdPage.drawText(selectedTags[2], {
      x: 306,
      y: 496,
      size: 11,
      font: NunitoBoldFont,
      color: rgb(0.09, 0.675, 1),
    });

    // notes from the mentor
    thirdPage.drawText(mentorNote, {
      x: 42,
      y: 570,
      size: 11,
      font: NunitoBoldFont,
      color: rgb(0.31, 0.31, 0.31),
    });

    // mentor name
    thirdPage.drawText(mentorName, {
      x: 412,
      y: 570,
      size: 11,
      font: NunitoBoldFont,
      color: rgb(0.31, 0.31, 0.31),
    });
  } else {
    url = `${process.env.FILE_BASE_URL}/python/course/postDemoPreTest.pdf`;
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

    const mentorRatingDialBytes = await fetch(getMentorDialUrl(5)).then((res) => res.buffer());
    const mentorRatingDialImage = await pdfDoc.embedPng(mentorRatingDialBytes);
    const mentorRatingDialDim = mentorRatingDialImage.scale(1);

    const Star1Bytes = await fetch(getMentorRatingStars(1)).then((res) => res.buffer());
    const Star1Image = await pdfDoc.embedPng(Star1Bytes);
    const Star1Dim = Star1Image.scale(1);
    const Star2Bytes = await fetch(getMentorRatingStars(2)).then((res) => res.buffer());
    const Star2Image = await pdfDoc.embedPng(Star2Bytes);
    const Star2Dim = Star2Image.scale(1);
    const Star3Bytes = await fetch(getMentorRatingStars(3)).then((res) => res.buffer());
    const Star3Image = await pdfDoc.embedPng(Star3Bytes);
    const Star3Dim = Star3Image.scale(1);
    const Star4Bytes = await fetch(getMentorRatingStars(4)).then((res) => res.buffer());
    const Star4Image = await pdfDoc.embedPng(Star4Bytes);
    const Star4Dim = Star4Image.scale(1);
    const Star5Bytes = await fetch(getMentorRatingStars(5)).then((res) => res.buffer());
    const Star5Image = await pdfDoc.embedPng(Star5Bytes);
    const Star5Dim = Star5Image.scale(1);
    /*
      FIRST PAGE
    */
    firstPage.drawText(`${'Parent Name'},`, {
      x: 100,
      y: 678,
      size: 15,
      font: NunitoBoldFont,
      color: rgb(0, 0.29, 0.678),
    });

    firstPage.drawText(`${'Student Name'}.`, {
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
      y: 800,
      width: mentorRatingDialDim.width,
      height: mentorRatingDialDim.height,
    });

    // critical thinking
    secondPage.drawImage(Star1Image, {
      x: 335,
      y: 786,
      width: Star1Dim.width,
      height: Star1Dim.height,
    });

    // logical thinking
    secondPage.drawImage(Star2Image, {
      x: 335,
      y: 753,
      width: Star2Dim.width,
      height: Star2Dim.height,
    });

    // communication skills
    secondPage.drawImage(Star3Image, {
      x: 335,
      y: 720,
      width: Star3Dim.width,
      height: Star3Dim.height,
    });

    // problem solving ability
    secondPage.drawImage(Star4Image, {
      x: 335,
      y: 687,
      width: Star4Dim.width,
      height: Star4Dim.height,
    });

    // creativity skills
    secondPage.drawImage(Star5Image, {
      x: 335,
      y: 654,
      width: Star5Dim.width,
      height: Star5Dim.height,
    });

    /*
      student tags
    */
    secondPage.drawText(selectedTags[0], {
      x: 146,
      y: 496,
      size: 11,
      font: NunitoBoldFont,
      color: rgb(0.09, 0.675, 1),
    });

    secondPage.drawText(selectedTags[1], {
      x: 226,
      y: 496,
      size: 11,
      font: NunitoBoldFont,
      color: rgb(0.09, 0.675, 1),
    });

    secondPage.drawText(selectedTags[2], {
      x: 306,
      y: 496,
      size: 11,
      font: NunitoBoldFont,
      color: rgb(0.09, 0.675, 1),
    });

    // notes from the mentor
    secondPage.drawText(mentorNote, {
      x: 42,
      y: 570,
      size: 11,
      font: NunitoBoldFont,
      color: rgb(0.31, 0.31, 0.31),
    });

    // mentor name
    secondPage.drawText(mentorName, {
      x: 412,
      y: 570,
      size: 11,
      font: NunitoBoldFont,
      color: rgb(0.31, 0.31, 0.31),
    });
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
    Phone: '9972181832',
    mx_IQA_Test_Report: `${process.env.FILE_BASE_URL}/${fetchedUrl}`,
  }, false);

  return fetchedUrl;
};

export default getPostDemoSalesReportUrl;

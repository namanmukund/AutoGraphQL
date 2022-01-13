/* eslint-disable no-restricted-syntax */
/* eslint-disable no-confusing-arrow */

import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { get } from 'lodash';
import * as fs from 'fs';
import fontkit from '@pdf-lib/fontkit';
import mkdirp from 'mkdirp';
import { NUNITO_BOLD_FONT_URL } from '../../../../../../../constants';
import { uploadToS3 } from '../../../../../../middlewares/utils/uploadToS3';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const capitalize = (str, lower = false) => (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) => match.toUpperCase());

const slugifyID = (ID) => ID ? ID.toString().trim().toUpperCase().replace(/\w{5}(?=.)/g, '$&-') : '';

const fetchEventDetails = async (eventId) => {
  const query = `
  {
  event(id: "${eventId}"){
    id
    eventType
    eventName
    baseCertificate{
      uri
    }
    embeds{
      image{
        uri
      }
      xDim
      yDim
      text
      textSize
      fontFamily
      variableName
    }
  }
}
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.event', {});
};

const getCertificateUrl = async (userId, eventId) => {
  const eventDetails = await fetchEventDetails(eventId);
  if (eventDetails && eventDetails.id) {
    const url = `${process.env.FILE_BASE_URL}/${get(eventDetails, 'baseCertificate.uri', '')}`;
    const existingPdfBytes = await fetch(url).then((res) => res.buffer());

    // Load a PDFDocument from the existing PDF bytes
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);

    // Get the first page of the document
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Embed the different possible fonts
    const NunitoBoldfontBytes = await fetch(NUNITO_BOLD_FONT_URL).then((res) => res.buffer());

    const NunitoBoldFont = await pdfDoc.embedFont(NunitoBoldfontBytes);

    // TODO : handle text color, images and fonts
    const getEmbedValues = (embed) => {
      const res = {};
      if (embed.text && embed.text.includes('Name')) {
        res.value = capitalize(embed.text);
      } else {
        res.value = embed.text;
      }
      res.properties = {};
      res.properties.x = embed.xDim;
      res.properties.y = embed.yDim;
      res.properties.size = embed.textSize;
      res.properties.font = NunitoBoldFont;
      if (get(embed, 'red') && get(embed, 'green') && get(embed, 'blue')) {
        res.properties.color = rgb(get(embed, 'red'), get(embed, 'green'), get(embed, 'blue'));
      } else {
        res.properties.color = rgb(0.3137, 0.31, 0.31);
      }
      if (get(embed, 'rotate')) {
        res.properties.rotate = degrees(get(embed, 'rotate'));
      }
      return res;
    };

    // TODO : handle for more than one pages
    for (const embed of get(eventDetails, 'embeds', [])) {
      const embedValues = getEmbedValues(embed);
      firstPage.drawText(embedValues.value, embedValues.properties);
    }

    /** PDF Meta Details */
    pdfDoc.setAuthor('Tekie');
    pdfDoc.setCreator('Kiwhode Learning Pvt Ltd');
    pdfDoc.setSubject(`Tekie's ${capitalize(eventDetails.eventName)} Certificate`);
    pdfDoc.setTitle(`Tekie's ${capitalize(eventDetails.eventName)} Certificate`);
    pdfDoc.setProducer('Tekie.in');

    const pdfBytes = await pdfDoc.save();
    const path = `/tmp/${eventDetails.eventName}/certificate-pdf.pdf`;
    mkdirp.sync(`/tmp/${eventDetails.eventName}`);
    fs.writeFileSync(path, pdfBytes);
    const fileContent = fs.readFileSync(path);
    let fetchedUrl = '';
    if (fileContent) {
      const key = `event-certificate/${eventDetails.eventName}/${slugifyID(userId)}-certificate.pdf`;
      await uploadToS3(key, fileContent);
      fetchedUrl = key;
    }
    return fetchedUrl;
  }
  return '';
};

export default getCertificateUrl;

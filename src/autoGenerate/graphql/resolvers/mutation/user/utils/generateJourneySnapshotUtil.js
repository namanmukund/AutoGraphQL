/* eslint-disable no-console */
import { PDFDocument, rgb } from 'pdf-lib'
import { format } from 'date-fns'
import * as fs from 'fs'
import { Buffer } from 'buffer'
import fontkit from '@pdf-lib/fontkit'
import { get } from 'lodash'
import { emailTemplates, LATO_BOLD_FONT_URL, GILROY_EXTRA_BOLD_FONT_URL, NUNITO_BOLD_FONT_URL } from '../../../../../../../constants'
import { uploadToS3 } from '../../../../../../../src/middlewares/utils'

const dataURItoBlob = (dataURI) => {
  const byteString = Buffer.from(dataURI, 'base64').toString();
  const url = `data:application/pdf;base64,${byteString}`

  return url
}

const generateJourneySnapshotUtil = async (templatetoFetch, data, userSavedCodes, userApprovedCodes, userPqCount) => {
  const user = get(data, 'user', {});
  const userName = get(user, 'name', '');
  const sessionDate = format(new Date(get(data, 'courseEndingDate')), 'MMM dd, yyyy');
  const courseName = get(data, 'course.title')

  if (courseName && userName && sessionDate) {
    try {
      const existingPdfBytes = await fetch(templatetoFetch === 'JourneySnapshot-1' ? get(emailTemplates, 'journeySnapshot.journeySnapshot1') : get(emailTemplates, 'journeySnapshot.journeySnapshot2')).then((res) => {
        return res.buffer()
      })

      // Load a PDFDocument from the existing PDF bytes
      const pdfDoc = await PDFDocument.load(existingPdfBytes)
      pdfDoc.registerFontkit(fontkit)

      // get font
      const LatoBoldfontBytes = await fetch(LATO_BOLD_FONT_URL).then((res) =>
        res.buffer()
      )

      const NunitoBoldfontBytes = await fetch(NUNITO_BOLD_FONT_URL).then((res) =>
        res.buffer()
      )

      const GilroyExtraBoldfontBytes = await fetch(GILROY_EXTRA_BOLD_FONT_URL).then((res) =>
        res.buffer()
      )

      // Embed our custom font in the document
      const LatoBoldFont = await pdfDoc.embedFont(LatoBoldfontBytes)
      const GilroyExtraBoldFont = await pdfDoc.embedFont(GilroyExtraBoldfontBytes)
      const NunitoBoldFont = await pdfDoc.embedFont(NunitoBoldfontBytes)

      // Get the first page of the document
      const pages = pdfDoc.getPages()
      const firstPage = pages[0]

      if (templatetoFetch === 'JourneySnapshot-1') {
        // TODO : add the positions here
      } else {
        // Draw a string of text diagonally across the first page
        await firstPage.drawText(userSavedCodes && userSavedCodes.length.toString(), {
          x: 85,
          y: 1240,
          size: 224,
          font: GilroyExtraBoldFont,
          color: rgb(0.827, 0.294, 0.341),
        })

        // Draw a string of text diagonally across the first page
        await firstPage.drawText(userPqCount.toString(), {
          x: 1180,
          y: 2040,
          size: 224,
          font: GilroyExtraBoldFont,
          color: rgb(0.729, 0.219, 0.51),
        })

        // Draw a string of text diagonally across the first page
        await firstPage.drawText(`# ${userName}'s Python Wrap`, {
          x: 300,
          y: 5000,
          size: 60,
          font: NunitoBoldFont,
          color: rgb(0.208, 0.894, 0.914),
        })
      }

      /** PDF Meta Details */
      pdfDoc.setAuthor('Tekie')
      pdfDoc.setCreator('Kiwhode Learning Pvt Ltd')
      pdfDoc.setSubject('Course Completion Certificate')
      pdfDoc.setTitle(courseName)
      pdfDoc.setProducer('Tekie.in')
      /**
       * Serialize the PDFDocument to bytes (a Uint8Array)
       * const pdfBytes = await pdfDoc.save();
       * */
      const pdfBytes = await pdfDoc.save();
      // const url = dataURItoBlob(pdfBase64)
      const path = '/Users/gokulmadhusudhan/Desktop/test-pdf.pdf';
      fs.writeFileSync('/Users/gokulmadhusudhan/Desktop/test-pdf.pdf', pdfBytes);
      const fileContent = fs.readFileSync(path);
      if (fileContent) {
        uploadToS3('python/email/test-pdf.pdf', fileContent);
      }
      // fs.writeFileSync('/Users/gokulmadhusudhan/Desktop/test-pdf.png', pdfBytes);

      // TODO : convert pdf to image and save in userCourseCompletion/journeySnapshot
      // TODO : then we return url of that journeySnapshot

      // to open the PDF in a new window
      // window.open(url, '_blank')
      return 'url'
    } catch (e) {
      console.log('PDF GENERATION EXCEPTION => ', e)
    }
  }
  return null
}

export default generateJourneySnapshotUtil;

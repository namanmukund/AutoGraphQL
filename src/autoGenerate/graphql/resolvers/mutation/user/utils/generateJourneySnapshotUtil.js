/* eslint-disable no-console */
import { PDFDocument, rgb } from 'pdf-lib'
import { format } from 'date-fns'
import fontkit from '@pdf-lib/fontkit'
import { get } from 'lodash'
import { emailTemplates } from '../../../../../../../constants'


const dataURItoBlob = (dataURI) => {
  const byteString = window.atob(dataURI)
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const int8Array = new Uint8Array(arrayBuffer)
  for (let i = 0; i < byteString.length; i += 1) {
    int8Array[i] = byteString.charCodeAt(i)
  }
  const blob = new Blob([int8Array], { type: 'application/pdf' })
  return blob
}

const generateJourneySnapshotUtil = async (templatetoFetch, data) => {
  const user = get(data, 'user', {});
  const userName = get(user, 'name');
  const sessionDate = format(new Date(get(data, 'courseEndingDate')), 'MMM dd, yyyy');
  const courseName = get(data, 'course.title')

  if (courseName && userName && sessionDate) {
    try {
      const existingPdfBytes = await fetch(templatetoFetch === 'JourneySnapshot-1' ? get(emailTemplates, 'journeySnapshot.journeySnapshot1') : get(emailTemplates, 'journeySnapshot.journeySnapshot2')).then((res) => res.arrayBuffer())

      // Load a PDFDocument from the existing PDF bytes
      const pdfDoc = await PDFDocument.load(existingPdfBytes)
      pdfDoc.registerFontkit(fontkit)

      // get font
      const LatoBoldfontBytes = await fetch(LATO_BOLD_FONT_URL).then((res) =>
        res.arrayBuffer()
      )

      // Embed our custom font in the document
      const LatoBoldFont = await pdfDoc.embedFont(LatoBoldfontBytes)

      // Get the first page of the document
      const pages = pdfDoc.getPages()
      const firstPage = pages[0]
      // Draw a string of text diagonally across the first page
      await firstPage.drawText('14', {
        x: 80,
        y: 2720,
        size: 224,
        font: LatoBoldFont,
        color: rgb(0.827, 0.294, 0.341),
      })
      await firstPage.drawText('442', {
        x: 80,
        y: 2090,
        size: 224,
        font: LatoBoldFont,
        color: rgb(1, 0.553, 0.929),
      })

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
      const pdfBase64 = await pdfDoc.saveAsBase64()

      const blob = dataURItoBlob(pdfBase64)
      const url = URL.createObjectURL(blob)
      // to open the PDF in a new window
      // window.open(url, '_blank')
      return url
    } catch (e) {
      console.log('PDF GENERATION EXCEPTION => ', e)
    }
  }
  return null
}

export default generateJourneySnapshotUtil;

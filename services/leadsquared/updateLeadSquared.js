import moment from 'moment'
import queryString from 'query-string'
import fetch from 'node-fetch'

const LEAD_CREATE_ENDPOINT = '/LeadManagement.svc/Lead.Capture?'
const LEAD_UPDATE_ENDPOINT = '/ProspectActivity.svc/CreateCustom?'

const LEAD_UPDATE_CODE = 99

const getLeadSquaredParams = (params = {}, create = false) => {
  const leadSquaredParams = []
  for (const key of Object.keys(params)) {
    leadSquaredParams.push({
      Attribute: key,
      Value: params[key]
    })
  }
  leadSquaredParams.push({
    Attribute: 'SearchBy',
    Value: 'Phone'
  })
  if (create) return leadSquaredParams
  return {
    LeadDetails: leadSquaredParams,
    Activity: {
      ActivityEvent: LEAD_UPDATE_CODE,
      ActivityNote: 'Lead API Update',
      ActivityDateTime: moment().utc().format('YYYY-MM-DD HH:mm:ss')
    }
  }
}

const logSheet = (Status, Data, Phone, error = '-') => {
  fetch('https://script.google.com/macros/s/AKfycbxmnOewZrOJNpbu_xALna5VJMKnM6wp66Df2F3j7tkzrmoJXpY/exec?' + queryString.stringify({
    Status,
    Data,
    Phone,
    Error: error
  }))
}

const updateSheet = async (leadSquaredParams = {}, create = false) => {
  const LEAD_ENDPOINT = create ? LEAD_CREATE_ENDPOINT : LEAD_UPDATE_ENDPOINT
  if (process.env.NODE_ENV === 'production') {
    fetch(
      process.env.LEAD_SQUARED_URL + LEAD_ENDPOINT + queryString.stringify({
        accessKey: process.env.LEAD_SQUARED_ACCESS_KEY,
        secretKey: process.env.LEAD_SQUARED_SECRET_KEY
      }), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(getLeadSquaredParams(leadSquaredParams, create))
      }
    ).then(res => {
      logSheet(res.status, JSON.stringify(getLeadSquaredParams(leadSquaredParams, create)), leadSquaredParams.Phone)
    }).catch(e => {
      logSheet('Failed', JSON.stringify(getLeadSquaredParams(leadSquaredParams, create)), leadSquaredParams.Phone, e)
    })
  }
}

export default updateSheet

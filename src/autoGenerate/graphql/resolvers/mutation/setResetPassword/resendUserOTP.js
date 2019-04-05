import { DatabaseRecordNotFoundError,
  MandatoryFieldNotSetError } from '../../../../../../constants/errors';
import { QueryController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { getNumberAndSendSms } from '../../../../../sms';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';

export default function resendUserOTPMutationResolver(
  root,
  params,
  typeName,
  info,
  fields,
  ast,
  authentication,
) {
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);

  validate(
    typeName,
    ast,
    SINGULAR,
    fieldsFetched,
    authentication,
  );

  const queryController = new QueryController(typeName, authentication);
  const { id } = params;
  return queryController.fetchOne({ id }).then((res) => {
    if (!res) {
      throw new DatabaseRecordNotFoundError();
    }
    const { name, phone, phoneOtp } = res;
    let fieldName = '';
    if (!phone) {
      fieldName = 'phone';
    }
    if (!phoneOtp) {
      fieldName = 'phoneOtp';
    }
    if (fieldName) {
      throw new MandatoryFieldNotSetError({ data: { fieldName } });
    }
    const phoneInfo = {
      phone,
      phoneOtp,
    };
    getNumberAndSendSms(phoneInfo, name);

    return res;
  }).catch(err => err);
}

import { batchType, PUBLISHED } from '../../../../../constants';
import { ProductTypeAlreadyAdded } from '../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import fetchSimilarProducts from './utils/CheckStatusForSimilarProductType';

const addProductValidation = async (params) => {
  const {
    schoolConnectId: schoolId, courseConnectId: courseId, input: {
      targetUserType, type, country, isDemoPack = false, status,
    },
  } = params;
  if (!courseId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'courseConnectId is missing in input',
      },
    });
  }
  if (status === PUBLISHED) {
    if (schoolId && targetUserType && (targetUserType === batchType.b2b2c || targetUserType === batchType.b2b) && type) {
      const products = await fetchSimilarProducts(schoolId, targetUserType, type, isDemoPack, country, null, courseId);
      if (products && products.length > 0) {
        throw new ProductTypeAlreadyAdded();
      }
    } else if (targetUserType === batchType.b2c) {
      const b2cProduct = await fetchSimilarProducts(null, targetUserType, type, isDemoPack, country, null, courseId);
      if (b2cProduct && b2cProduct.length > 0) {
        throw new ProductTypeAlreadyAdded();
      }
    }
  }
  return true;
};

export default addProductValidation;

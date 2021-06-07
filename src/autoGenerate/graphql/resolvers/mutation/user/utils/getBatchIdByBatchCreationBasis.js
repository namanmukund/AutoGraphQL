import { get } from 'lodash';

const getBatchIdByBatchCreationBasis = (
  batchCreationBasis,
  batches,
  studentGrade,
  studentSection,
) => {
  if (batchCreationBasis === 'grade') {
    // eslint-disable-next-line no-restricted-syntax
    for (const batch of batches) {
      const { classes } = batch;
      // eslint-disable-next-line no-restricted-syntax
      for (const schoolClass of classes) {
        if (get(schoolClass, 'grade') === studentGrade) {
          return batch.id;
        }
      }
    }
  } else {
    // eslint-disable-next-line no-restricted-syntax
    for (const batch of batches) {
      const { classes } = batch;
      // eslint-disable-next-line no-restricted-syntax
      for (const schoolClass of classes) {
        if (
          studentSection
                    && get(schoolClass, 'grade') === studentGrade
                    && get(schoolClass, 'section') === studentSection
        ) {
          return batch.id;
        }
      }
    }
  }
  return '';
};

export default getBatchIdByBatchCreationBasis;

/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
// format date - 23-24
const currentAcademicYear = '23_24';

// create different modal with different name for staging and for academic year
const differentVersionsOfModel = (model, includeAcademicYear = true) => {
  const stagingModel = {
    ...model,
    name: stagingModelName(model.name, 'previous'),
  };
  const productionModel = model;
  const stagingAcademicYearModel = {
    ...model,
    name: stagingModelName(model.name, currentAcademicYear),
  };
  const productionAcademicYearModel = {
    ...model,
    name: productionModelName(model.name, currentAcademicYear),
  };
  // if staging env then create table for staging env and for previous academic year
  if (process.env.NODE_ENV === 'staging') {
    if (includeAcademicYear) {
      return [stagingModel, stagingAcademicYearModel];
    }
    return [stagingModel];
  }
  // if production env then create table for production env
  if (includeAcademicYear) {
    return [productionAcademicYearModel, productionModel];
  }
  return [productionModel];
};

const stagingModelName = (modelName, academicYear) => {
  academicYear = academicYear || currentAcademicYear;
  if (academicYear === 'previous') {
    return `${modelName}_staging`;
  }
  return `${modelName}_staging_AY_${academicYear}`;
};
const productionModelName = (modelName, academicYear) => {
  academicYear = academicYear || currentAcademicYear;

  if (academicYear === 'previous') {
    return `${modelName}`;
  }
  return `${modelName}_AY_${academicYear}`;
};

export const currentModelName = (modelName, academicYear) => {
  if (process.env.NODE_ENV === 'staging') {
    return stagingModelName(modelName, academicYear);
  }
  return productionModelName(modelName, academicYear);
};

export default differentVersionsOfModel;

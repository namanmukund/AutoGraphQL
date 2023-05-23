/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */

import db from '../../db';

const { sequelize } = db;
// format date - 23-24
const currentAcademicYear = '23_24';

const createTable = (model, modelName, tableName) => {
  const tableData = model.getAttributes();
  // loop over the tableData and change the Model Key to modelName
  Object.keys(tableData).forEach((key) => {
    if (tableData[key].model) {
      tableData[key].model = modelName;
    }
  });
  return sequelize.define(
    modelName,
    tableData,
    {
      sequelize,
      isPgModel: true,
      tableName,
      modelName,
    },
  );
};

// create different modal with different name for staging and for academic year
const differentVersionsOfModel = (model, includeAcademicYear = true) => {
  const modelName = model.name;
  const tableName = model.getTableName();
  const stagingModel = createTable(model, stagingModelName(modelName, 'previous'), stagingModelName(tableName, 'previous'));
  const productionModel = createTable(model, productionModelName(modelName, 'previous'), productionModelName(tableName, 'previous'));
  const stagingAcademicYearModel = createTable(model, stagingModelName(modelName, currentAcademicYear), stagingModelName(tableName, currentAcademicYear));
  const productionAcademicYearModel = createTable(model, productionModelName(modelName, currentAcademicYear), productionModelName(tableName, currentAcademicYear));
  // if staging env then create table for staging env and for previous academic year
  if (process.env.NODE_ENV !== 'production') {
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
  if (process.env.NODE_ENV !== 'production') {
    return stagingModelName(modelName, academicYear);
  }
  return productionModelName(modelName, academicYear);
};

export default differentVersionsOfModel;

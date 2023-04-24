/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */

import db from "../../db";

const { sequelize } = db;
// format date - 23-24
const currentAcademicYear = '23_24';

const createTable = (model,tableName) => {
  const tableData = model.getAttributes()
  // loop over the tableData and change the Model Key to modelName
  Object.keys(tableData).forEach((key) => {
    if (tableData[key].model) {
      tableData[key].model = tableName
    }
  });    
  return sequelize.define(
    tableName,
    tableData,
     {
    sequelize,
    isPgModel: true,
    tableName: tableName,
    modelName: tableName && tableName.charAt(0).toUpperCase() + tableName.slice(1),
  },
  )
}

// create different modal with different name for staging and for academic year
const differentVersionsOfModel = (model, includeAcademicYear = true) => {
  const tableName = model.getTableName()
  const stagingModel = createTable(model,stagingModelName(tableName, 'previous') );
  const productionModel = createTable(model,productionModelName(tableName, 'previous'));
  const stagingAcademicYearModel = createTable( model,stagingModelName(tableName, currentAcademicYear));
  const productionAcademicYearModel = createTable( model,productionModelName(tableName, currentAcademicYear));
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

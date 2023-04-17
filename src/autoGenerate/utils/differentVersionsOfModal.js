
// format date - 23-24
const currentAcademyYear = new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().substr(-2);
console.log({currentAcademyYear})

// create different modal with different name for staging and for academic year
const differentVersionsOfModel = (model) => {
    const stagingModel = {
      ...model,
      name: stagingModelName(model.name, 'previous'),
    };
    const productionModel = {
      model
    }
    const stagingAcademicYearModelStaging = {
      ...model,
      name: stagingModelName(model.name, currentAcademyYear),
    };
    const productionAcademicYearModel = {
      ...model,
      name: productionModelName(model.name,currentAcademyYear),
    };
    if(process.env.NODE_ENV === 'staging'){
        return [
            stagingModel,stagingAcademicYearModelStaging
        ]
    }
    return [ productionAcademicYearModel,productionModel];
  }

const stagingModelName = (modelName,academicYear) => {
    academicYear = academicYear || currentAcademyYear
    if(academicYear === 'previous'){
        return `${modelName}_staging`;
    }
    return `${modelName}_staging_AY_${currentAcademyYear}`;
}
const productionModelName = (modelName) => {
    return `${modelName}_AY_${currentAcademyYear}`;
}

export const currentModelName = (modelName,academicYear) => {
    if(process.env.NODE_ENV === 'staging'){
        return stagingModelName(modelName,academicYear);
    }
    return productionModelName(modelName,academicYear);
}


export default differentVersionsOfModel;
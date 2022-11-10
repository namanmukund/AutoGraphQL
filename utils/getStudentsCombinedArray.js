import { get } from 'lodash';

// Combine batchStudents into students and also filter out if duplicates
const getStudentsCombinedArray = (input, checkWithId = false) => [...(input.students || []), ...(input.batchStudents || [])].filter((student, index, restStudentArray) => (restStudentArray || []).findIndex((restStudent) => ((checkWithId || !(get(restStudent, 'typeId') || get(student, 'typeId'))) ? (get(restStudent, 'id') === get(student, 'id')) : (get(restStudent, 'typeId') === get(student, 'typeId')))) === index);

export default getStudentsCombinedArray;

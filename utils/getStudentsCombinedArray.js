import { get } from 'lodash';

// Combine batchStudents into students and also filter out if duplicates
const getStudentsCombinedArray = (input) => [...(input.students || []), ...(input.batchStudents || [])].filter((student, index, restStudentArray) => (restStudentArray || []).findIndex((restStudent) => (get(restStudent, 'id') === get(student, 'id'))) === index);

export default getStudentsCombinedArray;

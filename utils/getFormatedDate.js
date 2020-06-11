import moment from 'moment';

const getFormatedDate = (date) => moment(date).format('DD-MM-YYYY');

export default getFormatedDate;

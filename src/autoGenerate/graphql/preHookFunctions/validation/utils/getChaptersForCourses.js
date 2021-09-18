import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getChaptersForCourses = async (coursesIds, title, chapterFilter) => {
  const query = `{
  chapters(filter: { and: [{ courses_some: { id_in: [${coursesIds}] } }, { title: "${title}" } ${chapterFilter || ''}] }) {
    id
  }
}`;

  const chaptersRes = await callLocalGraphqlApi(query);
  return get(chaptersRes, 'data.chapters');
};

export default getChaptersForCourses;

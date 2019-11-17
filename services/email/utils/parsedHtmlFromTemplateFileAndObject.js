import fs from 'fs';
import { template } from 'lodash';

// Clean html string parsed from html file to have only accepted utf-8 characters
const cleanString = (input) => {
  let output = '';
  for (let i = 0; i < input.length; i += 1) {
    if (input.charCodeAt(i) <= 127) {
      output += input.charAt(i);
    }
  }
  return output;
};

const parsedHtmlFromTemplateFileAndObject = (fileName, templateObject) => new Promise((resolve) => {
  fs.readFile(`static/templates/${fileName}.html`, 'utf8', (err, str) => {
    const createTemplateForHtml = template(str);
    const html = cleanString(createTemplateForHtml(templateObject));
    resolve(html);
  });
});

export default parsedHtmlFromTemplateFileAndObject;

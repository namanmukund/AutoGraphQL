// TODO: make the function accept multiple directivesToCheck and return their presence

const hasDirective = (directives, directiveToCheck) => {
  let modelExists = false;
  directives.forEach((directive) => {
    const directiveName = directive && directive.name.value;

    if (directiveName === directiveToCheck) {
      modelExists = true;
    }
  });
  return modelExists;
};

export default hasDirective;

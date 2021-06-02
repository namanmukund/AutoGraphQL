const birdwatch = (input, mutationName, context, params) => {
  console.log(mutationName);
  // console.log(JSON.stringify(input, null, 2));
  // console.log(JSON.stringify(params, null, 2));
  console.log(JSON.stringify(context.currentUser, null, 2));
  console.log(JSON.stringify(context.currentMentor, null, 2));
};

export default birdwatch;

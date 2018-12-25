const formatToParamString = input => JSON.stringify(input).replace(/"(\w+)"\s*:/g, '$1:');

export default formatToParamString;

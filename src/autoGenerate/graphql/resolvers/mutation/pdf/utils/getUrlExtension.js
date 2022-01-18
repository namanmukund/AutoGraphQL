const getUrlExtension = (url) => url.split(/[#?]/)[0].split('.').pop().trim();

export default getUrlExtension;

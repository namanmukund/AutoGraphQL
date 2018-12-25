import base64 from 'base-64';

const encodeToken = ({ appToken, userToken }) => base64.encode(`${appToken}::${userToken}`);

export default encodeToken;

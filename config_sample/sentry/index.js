import sentryConfig from './sentryConfig';

const environment = process.env.NODE_ENV || 'development';

export default sentryConfig[environment].sentryDSN;

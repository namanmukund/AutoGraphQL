/* This file is the default file for configurations to be used in comfig npm module .
This file is currently used in migrate npm module in which we are taking the mongodb path */
import allDbConfig from '.';

const application = process.env.APPLICATION || 'core';
const environment = process.env.NODE_ENV || 'development';
const dbPath = allDbConfig[application][environment].database.db;
export default dbPath;

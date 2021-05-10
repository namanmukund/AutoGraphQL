import mongoose from 'mongoose';
import { dbConfig } from '../utils';
import options from '../config/mongoDb/mongooseConfig';

mongoose.connect(dbConfig.dbUri, options);

export default mongoose.connection;

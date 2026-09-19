import mongoose from 'mongoose';
import cuid from 'cuid';
import { isNonNullType, isListType, getNamedType, GraphQLEnumType } from 'graphql';
import schema from '../../graphql';
import db from '../../db';
import models from '../../autoGenerate/models';
import { getDefaultDatabaseDialect } from '../../../constants';

/**
 * Returns model from either Mongoose or Sequelize
 */
export const getUnderlyingModel = (modelName) => {
  if (models && models[modelName]) {
    return { model: models[modelName], dialect: 'mongoose' };
  }
  if (db && db.mongoose && db.mongoose.models && db.mongoose.models[modelName]) {
    return { model: db.mongoose.models[modelName], dialect: 'mongoose' };
  }
  if (db && db.sequelize && db.sequelize.models && db.sequelize.models[modelName]) {
    return { model: db.sequelize.models[modelName], dialect: 'postgres' };
  }
  return null;
};

/**
 * Inspects GraphQL schema and models to return metadata on all registered models and fields.
 */
export const getAllModelsMetadata = async () => {
  const typeMap = schema.getTypeMap();
  const allModels = [];

  // Find all Enums in schema
  const enumsMap = {};
  Object.keys(typeMap).forEach((typeName) => {
    const type = typeMap[typeName];
    if (type instanceof GraphQLEnumType && !typeName.startsWith('__')) {
      enumsMap[typeName] = type.getValues().map((v) => v.name);
    }
  });

  const modelNames = Object.keys(models || {});

  for (const modelName of modelNames) {
    const gqlType = typeMap[modelName];
    const underlying = getUnderlyingModel(modelName);
    const dialect = underlying ? underlying.dialect : getDefaultDatabaseDialect();

    let recordCount = 0;
    try {
      if (underlying && underlying.dialect === 'mongoose') {
        recordCount = await underlying.model.countDocuments({});
      } else if (underlying && underlying.dialect === 'postgres') {
        recordCount = await underlying.model.count();
      }
    } catch (e) {
      recordCount = 0;
    }

    const fields = [];
    if (gqlType && gqlType.getFields) {
      const gqlFields = gqlType.getFields();
      Object.keys(gqlFields).forEach((fieldName) => {
        const field = gqlFields[fieldName];
        let currentType = field.type;
        const isRequired = isNonNullType(currentType);
        if (isRequired) currentType = currentType.ofType;
        const isList = isListType(currentType);
        if (isList) currentType = currentType.ofType;
        const isListRequired = isNonNullType(currentType);
        if (isListRequired) currentType = currentType.ofType;
        const namedType = getNamedType(field.type);
        const namedTypeName = namedType.name;

        const isEnum = Boolean(enumsMap[namedTypeName]);
        const enumValues = enumsMap[namedTypeName] || [];

        // Check if relation
        const isRelation = Boolean(models[namedTypeName]) && namedTypeName !== modelName;

        // Parse AST directives
        const directives = [];
        let isUnique = false;
        let isReadOnly = false;
        let isWriteOnly = false;
        let isEncrypted = false;
        let defaultValue = null;

        if (field.astNode && field.astNode.directives) {
          field.astNode.directives.forEach((dir) => {
            const dirName = dir.name.value;
            directives.push(dirName);
            if (dirName === 'unique' || dirName === 'uniqueOrEmpty') isUnique = true;
            if (dirName === 'readOnly') isReadOnly = true;
            if (dirName === 'writeOnly') isWriteOnly = true;
            if (dirName === 'encrypted') isEncrypted = true;
            if (dirName === 'defaultValue') {
              const arg = dir.arguments && dir.arguments.find((a) => a.name.value === 'value');
              if (arg && arg.value) {
                defaultValue = arg.value.value;
              }
            }
          });
        }

        fields.push({
          name: fieldName,
          type: namedTypeName,
          isList,
          isRequired,
          isRelation,
          relationTarget: isRelation ? namedTypeName : null,
          isEnum,
          enumValues,
          isUnique,
          isReadOnly,
          isWriteOnly,
          isEncrypted,
          defaultValue,
          directives,
        });
      });
    }

    allModels.push({
      name: modelName,
      dialect,
      recordCount,
      fields,
    });
  }

  return {
    models: allModels,
    enums: enumsMap,
  };
};

/**
 * List records with pagination, sorting, search and filtering.
 */
export const listRecords = async (modelName, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sortField = 'createdAt',
    sortOrder = 'desc',
    search = '',
    filterField = null,
    filterOp = null,
    filterVal = null,
  } = options;

  const underlying = getUnderlyingModel(modelName);
  if (!underlying) {
    throw new Error(`Model '${modelName}' not found`);
  }

  const numLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const numPage = Math.max(1, parseInt(page, 10) || 1);
  const skip = (numPage - 1) * numLimit;

  if (underlying.dialect === 'mongoose') {
    const query = {};

    // Apply quick search across string fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const schemaPaths = underlying.model.schema.paths;
      const orConditions = [];

      Object.keys(schemaPaths).forEach((p) => {
        if (schemaPaths[p].instance === 'String') {
          orConditions.push({ [p]: searchRegex });
        }
      });

      if (orConditions.length > 0) {
        query.$or = orConditions;
      }
    }

    // Apply specific field filter
    if (filterField && filterVal !== null && filterVal !== undefined && filterVal !== '') {
      switch (filterOp) {
        case 'eq':
          query[filterField] = filterVal;
          break;
        case 'ne':
          query[filterField] = { $ne: filterVal };
          break;
        case 'contains':
          query[filterField] = new RegExp(filterVal, 'i');
          break;
        case 'startsWith':
          query[filterField] = new RegExp(`^${filterVal}`, 'i');
          break;
        case 'gt':
          query[filterField] = { $gt: Number(filterVal) || filterVal };
          break;
        case 'gte':
          query[filterField] = { $gte: Number(filterVal) || filterVal };
          break;
        case 'lt':
          query[filterField] = { $lt: Number(filterVal) || filterVal };
          break;
        case 'lte':
          query[filterField] = { $lte: Number(filterVal) || filterVal };
          break;
        case 'boolean':
          query[filterField] = filterVal === 'true' || filterVal === true;
          break;
        default:
          query[filterField] = filterVal;
      }
    }

    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };
    const total = await underlying.model.countDocuments(query);
    const records = await underlying.model.find(query).sort(sort).skip(skip).limit(numLimit).lean();

    // Normalize IDs for consistent client consumption
    const normalizedRecords = records.map((doc) => ({
      ...doc,
      id: doc._id ? String(doc._id) : doc.id,
    }));

    return {
      records: normalizedRecords,
      total,
      page: numPage,
      limit: numLimit,
      totalPages: Math.ceil(total / numLimit) || 1,
    };
  }

  // PostgreSQL Sequelize
  if (underlying.dialect === 'postgres') {
    const where = {};
    const order = [[sortField, sortOrder.toUpperCase()]];

    const { count, rows } = await underlying.model.findAndCountAll({
      where,
      limit: numLimit,
      offset: skip,
      order,
      raw: true,
    });

    return {
      records: rows,
      total: count,
      page: numPage,
      limit: numLimit,
      totalPages: Math.ceil(count / numLimit) || 1,
    };
  }

  throw new Error(`Unsupported database dialect: ${underlying.dialect}`);
};

/**
 * Get a single record by ID
 */
export const getRecordById = async (modelName, id) => {
  const underlying = getUnderlyingModel(modelName);
  if (!underlying) throw new Error(`Model '${modelName}' not found`);

  if (underlying.dialect === 'mongoose') {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { id }] } : { id };
    const doc = await underlying.model.findOne(query).lean();
    if (!doc) return null;
    return { ...doc, id: doc.id || String(doc._id) };
  }

  if (underlying.dialect === 'postgres') {
    return underlying.model.findByPk(id, { raw: true });
  }

  return null;
};

/**
 * Create a new record
 */
export const createRecord = async (modelName, data) => {
  const underlying = getUnderlyingModel(modelName);
  if (!underlying) throw new Error(`Model '${modelName}' not found`);

  // Strip empty strings for numeric/date/relation fields and ensure cuid id
  const cleanData = { ...data };
  delete cleanData._id;
  if (!cleanData.id) {
    cleanData.id = cuid();
  }
  delete cleanData.createdAt;
  delete cleanData.updatedAt;

  if (underlying.dialect === 'mongoose') {
    const doc = await underlying.model.create(cleanData);
    const lean = doc.toObject();
    return { ...lean, id: lean.id || String(lean._id) };
  }

  if (underlying.dialect === 'postgres') {
    const record = await underlying.model.create(cleanData);
    return record.get({ plain: true });
  }

  throw new Error(`Unsupported database dialect: ${underlying.dialect}`);
};

/**
 * Update an existing record
 */
export const updateRecord = async (modelName, id, data) => {
  const underlying = getUnderlyingModel(modelName);
  if (!underlying) throw new Error(`Model '${modelName}' not found`);

  const updateFields = { ...data };
  delete updateFields._id;
  delete updateFields.id;
  delete updateFields.createdAt;
  delete updateFields.updatedAt;

  if (underlying.dialect === 'mongoose') {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { id }] } : { id };
    const updated = await underlying.model.findOneAndUpdate(
      query,
      { $set: updateFields },
      { new: true, runValidators: true },
    ).lean();

    if (!updated) throw new Error(`Record with ID '${id}' not found`);
    return { ...updated, id: updated.id || String(updated._id) };
  }

  if (underlying.dialect === 'postgres') {
    await underlying.model.update(updateFields, { where: { id } });
    return underlying.model.findByPk(id, { raw: true });
  }

  throw new Error(`Unsupported database dialect: ${underlying.dialect}`);
};

/**
 * Delete a record
 */
export const deleteRecord = async (modelName, id) => {
  const underlying = getUnderlyingModel(modelName);
  if (!underlying) throw new Error(`Model '${modelName}' not found`);

  if (underlying.dialect === 'mongoose') {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { id }] } : { id };
    const deleted = await underlying.model.findOneAndDelete(query);
    if (!deleted) throw new Error(`Record with ID '${id}' not found`);
    return { success: true, id };
  }

  if (underlying.dialect === 'postgres') {
    const count = await underlying.model.destroy({ where: { id } });
    if (!count) throw new Error(`Record with ID '${id}' not found`);
    return { success: true, id };
  }

  throw new Error(`Unsupported database dialect: ${underlying.dialect}`);
};

/**
 * Batch delete multiple records
 */
export const batchDeleteRecords = async (modelName, ids) => {
  const underlying = getUnderlyingModel(modelName);
  if (!underlying) throw new Error(`Model '${modelName}' not found`);
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('Array of IDs is required');
  }

  if (underlying.dialect === 'mongoose') {
    const res = await underlying.model.deleteMany({ _id: { $in: ids } });
    return { success: true, deletedCount: res.deletedCount };
  }

  if (underlying.dialect === 'postgres') {
    const deletedCount = await underlying.model.destroy({ where: { id: ids } });
    return { success: true, deletedCount };
  }

  throw new Error(`Unsupported database dialect: ${underlying.dialect}`);
};

/**
 * Export records as CSV string or JSON array
 */
export const exportRecords = async (modelName, format = 'json') => {
  const { records } = await listRecords(modelName, { limit: 1000, page: 1 });
  if (format === 'csv') {
    if (records.length === 0) return '';
    const headers = Object.keys(records[0]);
    const csvRows = [headers.join(',')];

    records.forEach((row) => {
      const values = headers.map((header) => {
        const val = row[header];
        if (val === null || val === undefined) return '""';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  return JSON.stringify(records, null, 2);
};

/**
 * Import array of records
 */
export const importRecords = async (modelName, records) => {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('Records must be a non-empty array');
  }

  const results = [];
  for (const record of records) {
    try {
      const created = await createRecord(modelName, record);
      results.push({ success: true, id: created.id });
    } catch (err) {
      results.push({ success: false, error: err.message });
    }
  }

  return {
    total: records.length,
    imported: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
};

/**
 * Generate contextual synthetic mock records for rapid prototyping
 */
export const generateMockRecords = async (modelName, count = 10) => {
  const meta = await getAllModelsMetadata();
  const modelMeta = meta.models.find((m) => m.name === modelName);
  if (!modelMeta) throw new Error(`Model '${modelName}' not found`);

  const numCount = Math.max(1, Math.min(100, parseInt(count, 10) || 10));
  const createdRecords = [];

  const firstNames = ['Aarav', 'Ananya', 'Rohan', 'Priya', 'Kabir', 'Zara', 'Vikram', 'Meera', 'Aditya', 'Sanya'];
  const lastNames = ['Sharma', 'Verma', 'Mukund', 'Patel', 'Reddy', 'Singh', 'Kapoor', 'Nair', 'Iyer', 'Gupta'];
  const words = ['Enterprise', 'Cloud', 'GraphQL', 'Platform', 'Security', 'Automation', 'Database', 'Engine', 'Reactive', 'Studio'];

  for (let i = 0; i < numCount; i += 1) {
    const recordData = {};
    const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lname = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randSuffix = Math.floor(Math.random() * 9000 + 1000);

    modelMeta.fields.forEach((field) => {
      const { name, type, isRequired, isList, isEnum, enumValues, defaultValue } = field;

      // Skip system fields
      if (['id', '_id', 'createdAt', 'updatedAt', '__v'].includes(name)) return;

      if (isEnum && enumValues.length > 0) {
        recordData[name] = enumValues[Math.floor(Math.random() * enumValues.length)];
        return;
      }

      const lowerName = name.toLowerCase();

      if (type === 'String') {
        if (lowerName.includes('email')) {
          recordData[name] = `${fname.toLowerCase()}.${lname.toLowerCase()}${randSuffix}@example.com`;
        } else if (lowerName.includes('name') || lowerName.includes('title')) {
          recordData[name] = lowerName.includes('title')
            ? `${words[Math.floor(Math.random() * words.length)]} ${words[Math.floor(Math.random() * words.length)]}`
            : `${fname} ${lname}`;
        } else if (lowerName.includes('phone')) {
          recordData[name] = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
        } else if (lowerName.includes('slug')) {
          recordData[name] = `slug-${fname.toLowerCase()}-${randSuffix}`;
        } else if (lowerName.includes('username')) {
          recordData[name] = `${fname.toLowerCase()}${randSuffix}`;
        } else if (lowerName.includes('bio') || lowerName.includes('content') || lowerName.includes('description')) {
          recordData[name] = `Generated description for ${fname}'s profile in AutoGraphQL Enterprise Studio.`;
        } else if (lowerName.includes('password')) {
          recordData[name] = 'P@ssw0rd123!';
        } else {
          recordData[name] = `Sample ${name} ${randSuffix}`;
        }
      } else if (type === 'Int') {
        recordData[name] = Math.floor(Math.random() * 100) + 1;
      } else if (type === 'Float') {
        recordData[name] = parseFloat((Math.random() * 100 + 10).toFixed(2));
      } else if (type === 'Boolean') {
        recordData[name] = Math.random() > 0.5;
      } else if (type === 'Date') {
        recordData[name] = new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString();
      } else if (type === 'JSONB' || type === 'JSON') {
        recordData[name] = { tag: 'auto-generated', seedId: randSuffix };
      } else if (isList && type === 'String') {
        recordData[name] = ['enterprise', 'graphql', 'studio'];
      }
    });

    try {
      const created = await createRecord(modelName, recordData);
      createdRecords.push(created);
    } catch (err) {
      // Continue with remaining records on collision
    }
  }

  return {
    success: true,
    modelName,
    countRequested: numCount,
    countCreated: createdRecords.length,
    records: createdRecords,
  };
};

/**
 * Purge mock data / records for a model
 */
export const purgeRecords = async (modelName) => {
  const underlying = getUnderlyingModel(modelName);
  if (!underlying) throw new Error(`Model '${modelName}' not found`);

  if (underlying.dialect === 'mongoose') {
    const res = await underlying.model.deleteMany({});
    return { success: true, deletedCount: res.deletedCount };
  }

  if (underlying.dialect === 'postgres') {
    const deletedCount = await underlying.model.destroy({ where: {}, truncate: true });
    return { success: true, deletedCount };
  }

  throw new Error(`Unsupported database dialect: ${underlying.dialect}`);
};

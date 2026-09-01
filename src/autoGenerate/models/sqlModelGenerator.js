import { DataTypes, Sequelize, Op } from 'sequelize';
import cuid from 'cuid';
import db from '../../db';
import { log } from '../../../utils';

// Fallback Sequelize instance if PostgreSQL is not connected
let fallbackSequelize = null;
export const getActiveSequelize = () => {
  if (db && db.sequelize && typeof db.sequelize.define === 'function') {
    return db.sequelize;
  }
  if (!fallbackSequelize) {
    fallbackSequelize = new Sequelize('postgres://postgres:postgres@localhost:5432/autographql', {
      dialect: 'postgres',
      logging: false,
    });
  }
  return fallbackSequelize;
};

/**
 * Maps GraphQL field AST definitions to Sequelize DataTypes and column options.
 *
 * @param {Object|Array} fieldDef - Field definition from AST visitor
 * @returns {Object} Sequelize attribute definition
 */
export const mapGraphQLFieldToSequelize = (fieldDef) => {
  const isArray = Array.isArray(fieldDef);
  const def = isArray ? fieldDef[0] : fieldDef;

  if (!def || typeof def !== 'object') {
    return { type: DataTypes.STRING, allowNull: true };
  }

  const rawType = def.type || 'String';
  let sequelizeType = DataTypes.STRING;

  switch (rawType) {
    case 'ID':
    case 'String':
      sequelizeType = DataTypes.STRING;
      break;
    case 'Int':
    case 'Integer':
      sequelizeType = DataTypes.INTEGER;
      break;
    case 'Float':
    case 'Number':
      sequelizeType = DataTypes.FLOAT;
      break;
    case 'Boolean':
      sequelizeType = DataTypes.BOOLEAN;
      break;
    case 'Date':
      sequelizeType = DataTypes.DATE;
      break;
    case 'JSON':
    case 'JSONB':
      sequelizeType = DataTypes.JSONB || DataTypes.TEXT;
      break;
    default:
      // Embedded types or relations stored as JSON / String
      sequelizeType = DataTypes.JSONB || DataTypes.STRING;
      break;
  }

  if (isArray) {
    // Array of scalar types or JSON
    sequelizeType = DataTypes.ARRAY ? DataTypes.ARRAY(sequelizeType) : DataTypes.JSONB;
  }

  const attribute = {
    type: sequelizeType,
    allowNull: !def.required,
  };

  if (def.unique) {
    attribute.unique = true;
  }

  if (def.default !== undefined) {
    attribute.defaultValue = def.default;
  }

  return attribute;
};

/**
 * Generates optimal PostgreSQL index configurations for a model.
 * Automatically chooses B-Tree for standard columns and GIN for JSONB / ARRAY columns.
 *
 * @param {Object} fieldsSchema
 * @param {Array} [customIndexes=[]]
 * @returns {Array} List of index definitions for Sequelize
 */
export const buildSequelizeIndexes = (fieldsSchema = {}, customIndexes = []) => {
  const indexes = [];

  Object.keys(fieldsSchema).forEach((fieldName) => {
    const fieldDef = fieldsSchema[fieldName];
    if (!fieldDef) return;

    const isIndexed = fieldDef.index || fieldDef.createIndex;
    const isUnique = fieldDef.unique;
    const rawType = Array.isArray(fieldDef) ? fieldDef[0]?.type : fieldDef?.type;
    const isJsonOrArray = Array.isArray(fieldDef) || rawType === 'JSON' || rawType === 'JSONB';

    if (isIndexed || isUnique) {
      const indexConfig = {
        fields: [fieldName],
      };

      if (isUnique) {
        indexConfig.unique = true;
      }

      // PostgreSQL GIN indexing for array and JSONB fields
      if (isJsonOrArray) {
        indexConfig.using = 'GIN';
      }

      indexes.push(indexConfig);
    }
  });

  // Attach any custom composite or partial indexes
  if (Array.isArray(customIndexes) && customIndexes.length > 0) {
    customIndexes.forEach((idx) => {
      if (idx && Array.isArray(idx.fields)) {
        indexes.push(idx);
      }
    });
  }

  return indexes;
};

/**
 * Dynamically builds a Sequelize model from GraphQL AST type definitions.
 *
 * @param {string} typeName - Model name (e.g. "Order", "Project")
 * @param {Object} fieldsSchema - Field definitions map from AST parser
 * @param {Sequelize} [customSequelize] - Optional custom Sequelize instance
 * @param {Array} [customIndexes] - Optional composite or custom index configs
 * @returns {Object} Sequelize Model
 */
export const createSequelizeModelFromAST = (
  typeName,
  fieldsSchema = {},
  customSequelize = null,
  customIndexes = [],
) => {
  const sequelize = customSequelize || getActiveSequelize();

  // If model is already defined on this sequelize instance, return it
  if (sequelize.isDefined && sequelize.isDefined(typeName)) {
    return sequelize.model(typeName);
  }

  const attributes = {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => cuid(),
    },
  };

  Object.keys(fieldsSchema).forEach((fieldName) => {
    // ID is already declared as primary key
    if (fieldName === 'id') return;

    const fieldDef = fieldsSchema[fieldName];
    const attribute = mapGraphQLFieldToSequelize(fieldDef);
    attributes[fieldName] = attribute;
  });

  const indexes = buildSequelizeIndexes(fieldsSchema, customIndexes);

  const modelOptions = {
    sequelize,
    tableName: typeName.toLowerCase(),
    modelName: typeName,
    timestamps: true,
    isPgModel: true,
    ...(indexes.length > 0 ? { indexes } : {}),
  };

  try {
    const Model = sequelize.define(typeName, attributes, modelOptions);
    Model.isPgModel = true;
    return Model;
  } catch (err) {
    log(`Failed to define Sequelize model for "${typeName}": ${err.message}`, 'error');
    return null;
  }
};

/**
 * Automatically wires PostgreSQL associations (1:1, 1:N, N:N, self-referencing) across Sequelize models.
 *
 * @param {Object} modelsMap - Map of compiled models
 * @param {Array<Object>} relationsList - List of relation metadata
 * @example
 * wireSequelizeAssociations(models, [
 *   { type: '1:1', source: 'User', target: 'UserProfile', foreignKey: 'userId', as: 'profile' },
 *   { type: '1:N', source: 'Author', target: 'Post', foreignKey: 'authorId', as: 'posts' },
 *   { type: 'N:N', source: 'Post', target: 'Tag', through: 'PostTags', foreignKey: 'postId', otherKey: 'tagId', as: 'tags' }
 * ]);
 */
export const wireSequelizeAssociations = (modelsMap = {}, relationsList = []) => {
  if (!Array.isArray(relationsList) || relationsList.length === 0) return;

  relationsList.forEach((rel) => {
    const {
      type,
      source: sourceName,
      target: targetName,
      foreignKey,
      otherKey,
      through,
      as,
      targetAs,
    } = rel;

    const SourceModel = modelsMap[sourceName];
    const TargetModel = modelsMap[targetName];

    if (!SourceModel || !TargetModel) return;

    try {
      switch (type) {
        case '1:1':
        case 'oneToOne': {
          SourceModel.hasOne(TargetModel, {
            foreignKey: foreignKey || `${sourceName.toLowerCase()}Id`,
            as: as || targetName.toLowerCase(),
          });
          TargetModel.belongsTo(SourceModel, {
            foreignKey: foreignKey || `${sourceName.toLowerCase()}Id`,
            as: targetAs || sourceName.toLowerCase(),
          });
          break;
        }

        case '1:N':
        case 'oneToMany': {
          SourceModel.hasMany(TargetModel, {
            foreignKey: foreignKey || `${sourceName.toLowerCase()}Id`,
            as: as || `${targetName.toLowerCase()}s`,
          });
          TargetModel.belongsTo(SourceModel, {
            foreignKey: foreignKey || `${sourceName.toLowerCase()}Id`,
            as: targetAs || sourceName.toLowerCase(),
          });
          break;
        }

        case 'N:N':
        case 'manyToMany': {
          const joinTable = through || `${sourceName}${targetName}s`;
          SourceModel.belongsToMany(TargetModel, {
            through: joinTable,
            foreignKey: foreignKey || `${sourceName.toLowerCase()}Id`,
            otherKey: otherKey || `${targetName.toLowerCase()}Id`,
            as: as || `${targetName.toLowerCase()}s`,
          });
          TargetModel.belongsToMany(SourceModel, {
            through: joinTable,
            foreignKey: otherKey || `${targetName.toLowerCase()}Id`,
            otherKey: foreignKey || `${sourceName.toLowerCase()}Id`,
            as: targetAs || `${sourceName.toLowerCase()}s`,
          });
          break;
        }

        default:
          break;
      }
    } catch (err) {
      log(`Warning: could not wire association ${sourceName} -> ${targetName}: ${err.message}`, 'warn');
    }
  });
};

/**
 * Translates AutoGraphQL filter AST into native Sequelize `where` operators.
 * Supports logical (and/or/not), comparisons (gt/gte/lt/lte), equality, set inclusion (in/notIn),
 * substring matchers (iLike for case-insensitive Postgres matching), and array/JSON containment.
 *
 * @param {Object} filter
 * @returns {Object} Sequelize where object with Symbol operators
 */
export const buildSequelizeWhereClause = (filter = {}) => {
  if (!filter || typeof filter !== 'object' || Object.keys(filter).length === 0) {
    return {};
  }

  const where = {};

  Object.keys(filter).forEach((key) => {
    const value = filter[key];

    // Logical operators
    if (key === 'and' && Array.isArray(value)) {
      where[Op.and] = value.map((f) => buildSequelizeWhereClause(f));
      return;
    }
    if (key === 'or' && Array.isArray(value)) {
      where[Op.or] = value.map((f) => buildSequelizeWhereClause(f));
      return;
    }
    if (key === 'not' && typeof value === 'object') {
      where[Op.not] = buildSequelizeWhereClause(value);
      return;
    }

    // Direct equality
    if (!key.includes('_')) {
      where[key] = value;
      return;
    }

    // Suffix operator parsing
    const lastUnderscoreIndex = key.lastIndexOf('_');
    const field = key.substring(0, lastUnderscoreIndex);
    const op = key.substring(lastUnderscoreIndex + 1);

    if (!where[field]) {
      where[field] = {};
    }

    switch (op) {
      case 'not':
        where[field][Op.ne] = value;
        break;
      case 'gt':
        where[field][Op.gt] = value;
        break;
      case 'gte':
        where[field][Op.gte] = value;
        break;
      case 'lt':
        where[field][Op.lt] = value;
        break;
      case 'lte':
        where[field][Op.lte] = value;
        break;
      case 'in':
        where[field][Op.in] = Array.isArray(value) ? value : [value];
        break;
      case 'not_in':
        where[field][Op.notIn] = Array.isArray(value) ? value : [value];
        break;
      case 'contains':
        // Case-insensitive ILIKE for PostgreSQL
        where[field][Op.iLike] = `%${value}%`;
        break;
      case 'startsWith':
        where[field][Op.iLike] = `${value}%`;
        break;
      case 'endsWith':
        where[field][Op.iLike] = `%${value}`;
        break;
      case 'exists':
        if (value === true) {
          where[field][Op.ne] = null;
        } else {
          where[field][Op.is] = null;
        }
        break;
      default:
        where[key] = value;
        break;
    }
  });

  return where;
};

export default {
  mapGraphQLFieldToSequelize,
  buildSequelizeIndexes,
  createSequelizeModelFromAST,
  wireSequelizeAssociations,
  buildSequelizeWhereClause,
  getActiveSequelize,
};

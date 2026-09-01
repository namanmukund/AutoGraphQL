import fs from 'fs';
import {
  buildSchema,
  findBreakingChanges,
  findDangerousChanges,
  printSchema,
  GraphQLSchema,
} from 'graphql';

/**
 * Ensures input is a valid GraphQLSchema object.
 * Accepts either a GraphQLSchema instance or an SDL string.
 *
 * @param {GraphQLSchema|string} schemaOrSdl
 * @returns {GraphQLSchema}
 */
const normalizeToSchema = (schemaOrSdl) => {
  if (schemaOrSdl instanceof GraphQLSchema) {
    return schemaOrSdl;
  }
  if (typeof schemaOrSdl === 'string') {
    return buildSchema(schemaOrSdl);
  }
  throw new Error('Invalid schema provided. Expected a GraphQLSchema instance or an SDL string.');
};

/**
 * Compares a baseline schema against a current schema and identifies breaking and dangerous changes.
 *
 * @param {GraphQLSchema|string} baseSchema - The previous/baseline schema
 * @param {GraphQLSchema|string} currentSchema - The proposed/current schema
 * @returns {{ isCompatible: boolean, breakingChanges: Array<Object>, dangerousChanges: Array<Object>, summary: Object }}
 */
export const compareSchemas = (baseSchema, currentSchema) => {
  const oldSchema = normalizeToSchema(baseSchema);
  const newSchema = normalizeToSchema(currentSchema);

  const breakingChanges = findBreakingChanges(oldSchema, newSchema);
  const dangerousChanges = findDangerousChanges(oldSchema, newSchema);

  const isCompatible = breakingChanges.length === 0;

  const summary = {
    isCompatible,
    totalBreaking: breakingChanges.length,
    totalDangerous: dangerousChanges.length,
    timestamp: new Date().toISOString(),
  };

  return {
    isCompatible,
    breakingChanges,
    dangerousChanges,
    summary,
  };
};

/**
 * Formats diff results into human-readable Markdown, Console tables, or JSON.
 *
 * @param {Object} diffResult - Result from compareSchemas
 * @param {Object} [options]
 * @param {'markdown'|'console'|'json'} [options.format='markdown']
 * @returns {string}
 */
export const formatDiffReport = (diffResult, { format = 'markdown' } = {}) => {
  const { isCompatible, breakingChanges, dangerousChanges, summary } = diffResult;

  if (format === 'json') {
    return JSON.stringify(diffResult, null, 2);
  }

  if (format === 'console') {
    const lines = [];
    lines.push('=== AutoGraphQL Schema Governance Report ===');
    lines.push(`Status: ${isCompatible ? 'COMPATIBLE' : 'BREAKING CHANGES DETECTED'}`);
    lines.push(`Breaking Changes: ${summary.totalBreaking} | Dangerous Changes: ${summary.totalDangerous}`);
    lines.push('');

    if (breakingChanges.length > 0) {
      lines.push('🚨 BREAKING CHANGES:');
      breakingChanges.forEach((b, idx) => {
        lines.push(`  ${idx + 1}. [${b.type}] ${b.description}`);
      });
      lines.push('');
    }

    if (dangerousChanges.length > 0) {
      lines.push('⚠️  DANGEROUS CHANGES:');
      dangerousChanges.forEach((d, idx) => {
        lines.push(`  ${idx + 1}. [${d.type}] ${d.description}`);
      });
      lines.push('');
    }

    if (isCompatible && dangerousChanges.length === 0) {
      lines.push('✅ No breaking or dangerous changes detected. Schema is backward-compatible.');
    }

    return lines.join('\n');
  }

  // Markdown format (ideal for CI PR comments)
  const md = [];
  md.push('## 🛡️ AutoGraphQL Schema Governance Report');
  md.push('');
  if (isCompatible) {
    md.push('> **Status**: ✅ **PASSED** — Schema is fully backward-compatible.');
  } else {
    md.push('> **Status**: ❌ **FAILED** — Breaking changes detected.');
  }
  md.push('');
  md.push('| Metric | Value |');
  md.push('| :--- | :--- |');
  md.push(`| **Compatible** | ${isCompatible ? 'Yes' : 'No'} |`);
  md.push(`| **Breaking Changes** | ${summary.totalBreaking} |`);
  md.push(`| **Dangerous Changes** | ${summary.totalDangerous} |`);
  md.push(`| **Timestamp** | ${summary.timestamp} |`);
  md.push('');

  if (breakingChanges.length > 0) {
    md.push('### 🚨 Breaking Changes');
    md.push('| Type | Description |');
    md.push('| :--- | :--- |');
    breakingChanges.forEach((c) => {
      md.push(`| \`${c.type}\` | ${c.description} |`);
    });
    md.push('');
  }

  if (dangerousChanges.length > 0) {
    md.push('### ⚠️ Dangerous Changes');
    md.push('| Type | Description |');
    md.push('| :--- | :--- |');
    dangerousChanges.forEach((c) => {
      md.push(`| \`${c.type}\` | ${c.description} |`);
    });
    md.push('');
  }

  return md.join('\n');
};

/**
 * Validates a schema against a baseline file on disk.
 *
 * @param {string} baselineFilePath
 * @param {GraphQLSchema|string} currentSchema
 * @returns {{ isCompatible: boolean, breakingChanges: Array, dangerousChanges: Array, summary: Object }}
 */
export const validateSchemaAgainstBaseline = (baselineFilePath, currentSchema) => {
  if (!fs.existsSync(baselineFilePath)) {
    throw new Error(`Baseline schema file not found at: ${baselineFilePath}`);
  }

  const baseSdl = fs.readFileSync(baselineFilePath, 'utf8');
  return compareSchemas(baseSdl, currentSchema);
};

export default {
  compareSchemas,
  formatDiffReport,
  validateSchemaAgainstBaseline,
  normalizeToSchema,
};

import {
  getNamedType,
  isCompositeType,
  GraphQLUnionType,
} from 'graphql';
import { getArgumentValues } from 'graphql/execution/values';
import { log } from './log';

const DEBUG_ENABLED = false;

function getFieldFromAST(
  ast,
  parentType,
) {
  if (ast.kind === 'Field') {
    const fieldNode = ast;
    const fieldName = fieldNode.name.value;
    if (!(parentType instanceof GraphQLUnionType)) {
      const type = parentType;
      return type.getFields()[fieldName];
    }
    if (DEBUG_ENABLED && parentType instanceof GraphQLUnionType) log(`${parentType}[GraphQLUnionType] Skipped`);
  }
  return undefined;
}

const hasOwnProperty = Object.prototype.hasOwnProperty;
// eslint-disable-next-line consistent-return
function getFirstKey(obj) {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj) {
    if (hasOwnProperty.call(obj, key)) {
      return key;
    }
  }
}

function getType(
  resolveInfo,
  typeCondition,
) {
  const { schema } = resolveInfo;
  const { kind, name } = typeCondition;
  if (kind === 'NamedType') {
    const typeName = name.value;
    return schema.getType(typeName);
  }
  return null;
}

let iNum = 1;
function buildFieldTreeFromAST(
  inASTs,
  resolveInfo,
  initialTreeObj = {},
  options = {},
  parentType,
  depth = '',
) {
  iNum += 1;
  const instance = iNum;
  const initTree = initialTreeObj;
  const { variableValues } = resolveInfo;
  const fragments = resolveInfo.fragments || {};
  const asts = Array.isArray(inASTs) ? inASTs : [inASTs];
  if (!initTree[parentType.name]) {
    initTree[parentType.name] = {};
  }
  const outerDepth = depth;
  return asts.reduce((ASTtree, selectionVal, idx) => {
    const tree = ASTtree;
    const depthCount = DEBUG_ENABLED ? `${outerDepth}  ` : null;
    if (DEBUG_ENABLED) {
      log(
        `${depthCount}[instance] Processing AST ${idx + 1} of ${asts.length}; kind = ${selectionVal.kind}`,
      );
    }
    if (selectionVal.kind === 'Field') {
      const val = selectionVal;
      const name = val.name.value;
      const isReserved = name[0] === '_' && name[1] === '_' && name !== '__id';
      if (isReserved) {
        if (DEBUG_ENABLED) { log(`${depthCount}[${instance}] IGNORING because field '${name}' is reserved`); }
      } else {
        const alias = val.alias && val.alias.value ? val.alias.value : name;
        if (DEBUG_ENABLED) { log(`${depthCount}[${instance}] Field '${name}' (alias = '${alias}')`); }
        const field = getFieldFromAST(val, parentType);
        if (field == null) {
          return tree;
        }
        const fieldGqlTypeOrUndefined = getNamedType(field.type);
        if (!fieldGqlTypeOrUndefined) {
          return tree;
        }
        const fieldGqlType = fieldGqlTypeOrUndefined;
        const args = getArgumentValues(field, val, variableValues) || {};
        if (parentType.name && !tree[parentType.name][alias]) {
          const newTreeRoot = {
            name,
            alias,
            args,
            fieldsByTypeName: isCompositeType(fieldGqlType)
              ? {
                [fieldGqlType.name]: {},
              }
              : {},
          };
          tree[parentType.name][alias] = newTreeRoot;
        }
        const selectionSet = val.selectionSet;
        if (
          selectionSet != null
          && options.deep
          && isCompositeType(fieldGqlType)
        ) {
          const newParentType = fieldGqlType;
          if (DEBUG_ENABLED) { log(`${depthCount}[${instance}] Recursing into subfields`); }
          buildFieldTreeFromAST(
            selectionSet.selections,
            resolveInfo,
            tree[parentType.name][alias].fieldsByTypeName,
            options,
            newParentType,
            `${depthCount}  `,
          );
        } else {
          // eslint-disable-next-line no-lonely-if
          if (DEBUG_ENABLED) { log(`${depthCount}[${instance}] Exiting (no fields to add)`); }
        }
      }
    } else if (selectionVal.kind === 'FragmentSpread' && options.deep) {
      const val = selectionVal;
      const name = val.name && val.name.value;
      if (DEBUG_ENABLED) { log(`${depthCount}[${instance}] Fragment spread '${name}'`); }
      const fragment = fragments[name];
      let fragmentType = parentType;
      if (fragment.typeCondition) {
        fragmentType = getType(resolveInfo, fragment.typeCondition);
      }
      if (fragmentType && isCompositeType(fragmentType)) {
        const newParentType = fragmentType;
        buildFieldTreeFromAST(
          fragment.selectionSet.selections,
          resolveInfo,
          tree,
          options,
          newParentType,
          `${depthCount}  `,
        );
      }
    } else if (selectionVal.kind === 'InlineFragment' && options.deep) {
      const val = selectionVal;
      const fragment = val;
      let fragmentType = parentType;
      if (fragment.typeCondition) {
        fragmentType = getType(resolveInfo, fragment.typeCondition);
      }
      if (DEBUG_ENABLED) {
        debug(
          `${depthCount}[${instance}] Inline fragment (parent = '${parentType}', type = '${fragmentType}')`,
        );
      }
      if (fragmentType && isCompositeType(fragmentType)) {
        const newParentType = fragmentType;
        buildFieldTreeFromAST(
          fragment.selectionSet.selections,
          resolveInfo,
          tree,
          options,
          newParentType,
          `${depthCount}  `,
        );
      }
    } else if (DEBUG_ENABLED) {
      log(
        `${depthCount}[${instance}] IGNORING because kind '${selectionVal.kind}' not understood`,
      );
    }
    return tree;
  }, initTree);
}

const parseGraphqlResolveInfo = (resolveInfo, parseOptions = {}) => {
  const options = parseOptions;
  const fieldNodes = resolveInfo.fieldNodes || resolveInfo.fieldASTs;

  const { parentType } = resolveInfo;
  if (!fieldNodes) {
    log('No fieldNodes provided in Resolver Info.', 'Parse Error', false, true);
    return null;
  }
  if (options.deep == null) {
    options.deep = true;
  }
  const tree = buildFieldTreeFromAST(
    fieldNodes,
    resolveInfo,
    undefined,
    options,
    parentType,
  );
  const typeKey = getFirstKey(tree);
  if (!typeKey) {
    return null;
  }
  const fields = tree[typeKey];
  const fieldKey = getFirstKey(fields);
  if (!fieldKey) {
    return null;
  }
  return fields[fieldKey];
};

export default parseGraphqlResolveInfo;

import type { CaipReference } from '@metamask/utils';
import { cloneDeep } from 'lodash';

import type {
  ExternalScopeObject,
  ExternalScopesObject,
  NormalizedScopeObject,
  NormalizedScopesObject,
} from './types';
import { parseScopeString } from './types';

/**
 * Returns a list of unique items
 *
 * @param list - The list of items to filter
 * @returns A list of unique items
 */
export const getUniqueArrayItems = <Value>(list: Value[]): Value[] => {
  return Array.from(new Set(list));
};

/**
 * Normalizes a ScopeString and ExternalScopeObject into a separate
 * InternalScopeString and NormalizedScopeObject for each reference in the `references`
 * value if defined and adds an empty `accounts` array if not defined.
 *
 * @param scopeString - The string representing the scope
 * @param externalScopeObject - The object that defines the scope
 * @returns a map of caipChainId to ScopeObjects
 */
export const normalizeScope = (
  scopeString: string,
  externalScopeObject: ExternalScopeObject,
): NormalizedScopesObject => {
  const { references, ...scopeObject } = externalScopeObject;
  const { namespace, reference } = parseScopeString(scopeString);

  const normalizedScopeObject: NormalizedScopeObject = {
    accounts: [],
    ...scopeObject,
  };

  const shouldFlatten =
    namespace &&
    !reference &&
    references !== undefined &&
    references.length > 0;

  if (shouldFlatten) {
    return Object.fromEntries(
      references.map((ref: CaipReference) => [
        `${namespace}:${ref}`,
        cloneDeep(normalizedScopeObject),
      ]),
    );
  }
  return { [scopeString]: normalizedScopeObject };
};

/**
 * Merges two NormalizedScopeObjects
 * @param scopeObjectA - The first scope object to merge.
 * @param scopeObjectB - The second scope object to merge.
 * @returns The merged scope object.
 */
export const mergeScopeObject = (
  scopeObjectA: NormalizedScopeObject,
  scopeObjectB: NormalizedScopeObject,
) => {
  const mergedScopeObject: NormalizedScopeObject = {
    methods: getUniqueArrayItems([
      ...scopeObjectA.methods,
      ...scopeObjectB.methods,
    ]),
    notifications: getUniqueArrayItems([
      ...scopeObjectA.notifications,
      ...scopeObjectB.notifications,
    ]),
    accounts: getUniqueArrayItems([
      ...scopeObjectA.accounts,
      ...scopeObjectB.accounts,
    ]),
  };

  if (scopeObjectA.rpcDocuments || scopeObjectB.rpcDocuments) {
    mergedScopeObject.rpcDocuments = getUniqueArrayItems([
      ...(scopeObjectA.rpcDocuments ?? []),
      ...(scopeObjectB.rpcDocuments ?? []),
    ]);
  }

  if (scopeObjectA.rpcEndpoints || scopeObjectB.rpcEndpoints) {
    mergedScopeObject.rpcEndpoints = getUniqueArrayItems([
      ...(scopeObjectA.rpcEndpoints ?? []),
      ...(scopeObjectB.rpcEndpoints ?? []),
    ]);
  }

  return mergedScopeObject;
};

/**
 * Merges two NormalizedScopeObjects
 * @param scopeA - The first scope object to merge.
 * @param scopeB - The second scope object to merge.
 * @returns The merged scope object.
 */
export const mergeScopes = (
  scopeA: NormalizedScopesObject,
  scopeB: NormalizedScopesObject,
): NormalizedScopesObject => {
  const scope: NormalizedScopesObject = {};

  Object.entries(scopeA).forEach(([_scopeString, scopeObjectA]) => {
    // Cast needed because index type is returned as `string` by `Object.entries`
    const scopeString = _scopeString as keyof typeof scopeA;
    const scopeObjectB = scopeB[scopeString];

    scope[scopeString] = scopeObjectB
      ? mergeScopeObject(scopeObjectA, scopeObjectB)
      : scopeObjectA;
  });

  Object.entries(scopeB).forEach(([_scopeString, scopeObjectB]) => {
    // Cast needed because index type is returned as `string` by `Object.entries`
    const scopeString = _scopeString as keyof typeof scopeB;
    const scopeObjectA = scopeA[scopeString];

    if (!scopeObjectA) {
      scope[scopeString] = scopeObjectB;
    }
  });

  return scope;
};

/**
 * Normalizes and merges a set of ExternalScopesObjects into a NormalizedScopesObject (i.e. a set of NormalizedScopeObjects where references are flattened).
 * @param scopes - The external scopes to normalize and merge.
 * @returns The normalized and merged scopes.
 */
export const normalizeAndMergeScopes = (
  scopes: ExternalScopesObject,
): NormalizedScopesObject => {
  let mergedScopes: NormalizedScopesObject = {};
  Object.keys(scopes).forEach((scopeString) => {
    const normalizedScopes = normalizeScope(scopeString, scopes[scopeString]);
    mergedScopes = mergeScopes(mergedScopes, normalizedScopes);
  });

  return mergedScopes;
};

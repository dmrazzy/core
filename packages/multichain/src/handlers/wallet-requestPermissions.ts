import { isPlainObject } from '@metamask/controller-utils';
import type {
  AsyncJsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
} from '@metamask/json-rpc-engine';
import {
  type Caveat,
  type CaveatSpecificationConstraint,
  invalidParams,
  MethodNames,
  type PermissionController,
  type PermissionSpecificationConstraint,
  type RequestedPermissions,
  type ValidPermission,
} from '@metamask/permission-controller';
import type {
  Json,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import { pick } from 'lodash';

import { getPermittedEthChainIds } from '../adapters/caip-permission-adapter-permittedChains';
import {
  Caip25CaveatType,
  type Caip25CaveatValue,
  Caip25EndowmentPermissionName,
} from '../caip25Permission';
import {
  CaveatTypes,
  EndowmentTypes,
  RestrictedMethods,
} from '../constants/permissions';

export const requestPermissionsHandler = {
  methodNames: [MethodNames.RequestPermissions],
  implementation: requestPermissionsImplementation,
  hookNames: {
    getAccounts: true,
    requestPermissionsForOrigin: true,
    getCaip25PermissionFromLegacyPermissionsForOrigin: true,
  },
};

type AbstractPermissionController = PermissionController<
  PermissionSpecificationConstraint,
  CaveatSpecificationConstraint
>;

type GrantedPermissions = Awaited<
  ReturnType<AbstractPermissionController['requestPermissions']>
>[0];

/**
 * Request Permissions implementation to be used in JsonRpcEngine middleware, specifically for `wallet_requestPermissions` RPC method.
 * The request object is expected to contain a CAIP-25 endowment permission.
 *
 * @param req - The JsonRpcEngine request
 * @param res - The JsonRpcEngine result object
 * @param _next - JsonRpcEngine next() callback - unused
 * @param end - JsonRpcEngine end() callback
 * @param options - Method hooks passed to the method implementation
 * @param options.getAccounts - A hook that returns the permitted eth accounts for the origin sorted by lastSelected.
 * @param options.getCaip25PermissionFromLegacyPermissionsForOrigin - A hook that returns a CAIP-25 permission from a legacy `eth_accounts` and `endowment:permitted-chains` permission.
 * @param options.requestPermissionsForOrigin - A hook that requests CAIP-25 permissions for the origin.
 * @returns A promise that resolves to nothing
 */
async function requestPermissionsImplementation(
  req: JsonRpcRequest<[RequestedPermissions]> & { origin: string },
  res: PendingJsonRpcResponse,
  _next: AsyncJsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    getAccounts,
    requestPermissionsForOrigin,
    getCaip25PermissionFromLegacyPermissionsForOrigin,
  }: {
    getAccounts: () => string[];
    requestPermissionsForOrigin: (
      requestedPermissions: RequestedPermissions,
    ) => Promise<[GrantedPermissions]>;
    getCaip25PermissionFromLegacyPermissionsForOrigin: (
      requestedPermissions?: RequestedPermissions,
    ) => RequestedPermissions;
  },
) {
  const { params } = req;

  if (!Array.isArray(params) || !isPlainObject(params[0])) {
    return end(invalidParams({ data: { request: req } }));
  }

  let [requestedPermissions] = params;
  delete requestedPermissions[Caip25EndowmentPermissionName];

  const caip25EquivalentPermissions: Partial<
    Pick<RequestedPermissions, 'eth_accounts' | 'endowment:permitted-chains'>
  > = pick(requestedPermissions, [
    RestrictedMethods.EthAccounts,
    EndowmentTypes.PermittedChains,
  ]);
  delete requestedPermissions[RestrictedMethods.EthAccounts];
  delete requestedPermissions[EndowmentTypes.PermittedChains];

  const hasCaip25EquivalentPermissions =
    Object.keys(caip25EquivalentPermissions).length > 0;

  if (hasCaip25EquivalentPermissions) {
    const caip25Permission = getCaip25PermissionFromLegacyPermissionsForOrigin(
      caip25EquivalentPermissions,
    );
    requestedPermissions = { ...requestedPermissions, ...caip25Permission };
  }

  let grantedPermissions: GrantedPermissions = {};

  const [frozenGrantedPermissions] =
    await requestPermissionsForOrigin(requestedPermissions);

  grantedPermissions = { ...frozenGrantedPermissions };

  if (hasCaip25EquivalentPermissions) {
    const caip25Endowment = grantedPermissions[Caip25EndowmentPermissionName];

    if (!caip25Endowment) {
      throw new Error(
        `could not find ${Caip25EndowmentPermissionName} permission.`,
      );
    }

    const caip25CaveatValue = caip25Endowment.caveats?.find(
      ({ type }) => type === Caip25CaveatType,
    )?.value as Caip25CaveatValue | undefined;
    if (!caip25CaveatValue) {
      throw new Error(
        `could not find ${Caip25CaveatType} in granted ${Caip25EndowmentPermissionName} permission.`,
      );
    }

    delete grantedPermissions[Caip25EndowmentPermissionName];
    // We cannot derive correct eth_accounts value directly from the CAIP-25 permission
    // because the accounts will not be in order of lastSelected
    const ethAccounts = getAccounts();

    grantedPermissions[RestrictedMethods.EthAccounts] = {
      ...caip25Endowment,
      parentCapability: RestrictedMethods.EthAccounts,
      caveats: [
        {
          type: CaveatTypes.RestrictReturnedAccounts,
          value: ethAccounts,
        },
      ],
    };

    const ethChainIds = getPermittedEthChainIds(caip25CaveatValue);

    if (ethChainIds.length > 0) {
      grantedPermissions[EndowmentTypes.PermittedChains] = {
        ...caip25Endowment,
        parentCapability: EndowmentTypes.PermittedChains,
        caveats: [
          {
            type: CaveatTypes.RestrictNetworkSwitching,
            value: ethChainIds,
          },
        ],
      };
    }
  }

  res.result = Object.values(grantedPermissions).filter(
    (
      permission: ValidPermission<string, Caveat<string, Json>> | undefined,
    ): permission is ValidPermission<string, Caveat<string, Json>> =>
      permission !== undefined,
  );
  return end();
}

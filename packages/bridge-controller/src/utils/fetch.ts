import type { Hex } from '@metamask/utils';
import { hexToNumber, numberToHex } from '@metamask/utils';

import {
  isSwapsDefaultTokenAddress,
  isSwapsDefaultTokenSymbol,
} from './bridge';
import {
  validateFeatureFlagsResponse,
  validateQuoteResponse,
  validateSwapsTokenObject,
} from './validators';
import { DEFAULT_FEATURE_FLAG_CONFIG } from '../constants/bridge';
import type { SwapsTokenObject } from '../constants/tokens';
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../constants/tokens';
import type {
  QuoteRequest,
  QuoteResponse,
  BridgeFeatureFlags,
  FetchFunction,
  ChainConfiguration,
} from '../types';
import { BridgeFlag, BridgeFeatureFlagsKey } from '../types';

// TODO put this back in once we have a fetchWithCache equivalent
// const CACHE_REFRESH_TEN_MINUTES = 10 * Duration.Minute;

export const getClientIdHeader = (clientId: string) => ({
  'X-Client-Id': clientId,
});

/**
 * Fetches the bridge feature flags
 *
 * @param clientId - The client ID for metrics
 * @param fetchFn - The fetch function to use
 * @param bridgeApiBaseUrl - The base URL for the bridge API
 * @returns The bridge feature flags
 */
export async function fetchBridgeFeatureFlags(
  clientId: string,
  fetchFn: FetchFunction,
  bridgeApiBaseUrl: string,
): Promise<BridgeFeatureFlags> {
  const url = `${bridgeApiBaseUrl}/getAllFeatureFlags`;
  const rawFeatureFlags: unknown = await fetchFn(url, {
    headers: getClientIdHeader(clientId),
  });

  if (validateFeatureFlagsResponse(rawFeatureFlags)) {
    const getChainsObj = (chains: Record<number, ChainConfiguration>) =>
      Object.entries(chains).reduce(
        (acc, [chainId, value]) => ({
          ...acc,
          [numberToHex(Number(chainId))]: value,
        }),
        {},
      );

    return {
      [BridgeFeatureFlagsKey.EXTENSION_CONFIG]: {
        ...rawFeatureFlags[BridgeFlag.EXTENSION_CONFIG],
        chains: getChainsObj(
          rawFeatureFlags[BridgeFlag.EXTENSION_CONFIG].chains,
        ),
      },
      [BridgeFeatureFlagsKey.MOBILE_CONFIG]: {
        ...rawFeatureFlags[BridgeFlag.MOBILE_CONFIG],
        chains: getChainsObj(rawFeatureFlags[BridgeFlag.MOBILE_CONFIG].chains),
      },
    };
  }

  return {
    [BridgeFeatureFlagsKey.EXTENSION_CONFIG]: DEFAULT_FEATURE_FLAG_CONFIG,
    [BridgeFeatureFlagsKey.MOBILE_CONFIG]: DEFAULT_FEATURE_FLAG_CONFIG,
  };
}

/**
 * Returns a list of enabled (unblocked) tokens
 *
 * @param chainId - The chain ID to fetch tokens for
 * @param clientId - The client ID for metrics
 * @param fetchFn - The fetch function to use
 * @param bridgeApiBaseUrl - The base URL for the bridge API
 * @returns A list of enabled (unblocked) tokens
 */
export async function fetchBridgeTokens(
  chainId: Hex,
  clientId: string,
  fetchFn: FetchFunction,
  bridgeApiBaseUrl: string,
): Promise<Record<string, SwapsTokenObject>> {
  // TODO make token api v2 call
  const url = `${bridgeApiBaseUrl}/getTokens?chainId=${hexToNumber(chainId)}`;

  // TODO we will need to cache these. In Extension fetchWithCache is used. This is due to the following:
  // If we allow selecting dest networks which the user has not imported,
  // note that the Assets controller won't be able to provide tokens. In extension we fetch+cache the token list from bridge-api to handle this
  const tokens = await fetchFn(url, {
    headers: getClientIdHeader(clientId),
  });

  const nativeToken =
    SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
      chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
    ];

  const transformedTokens: Record<string, SwapsTokenObject> = {};
  if (nativeToken) {
    transformedTokens[nativeToken.address] = nativeToken;
  }

  tokens.forEach((token: unknown) => {
    if (
      validateSwapsTokenObject(token) &&
      !(
        isSwapsDefaultTokenSymbol(token.symbol, chainId) ||
        isSwapsDefaultTokenAddress(token.address, chainId)
      )
    ) {
      transformedTokens[token.address] = token;
    }
  });
  return transformedTokens;
}

// Returns a list of bridge tx quotes
/**
 *
 * @param request - The quote request
 * @param signal - The abort signal
 * @param clientId - The client ID for metrics
 * @param fetchFn - The fetch function to use
 * @param bridgeApiBaseUrl - The base URL for the bridge API
 * @returns A list of bridge tx quotes
 */
export async function fetchBridgeQuotes(
  request: QuoteRequest,
  signal: AbortSignal,
  clientId: string,
  fetchFn: FetchFunction,
  bridgeApiBaseUrl: string,
): Promise<QuoteResponse[]> {
  const queryParams = new URLSearchParams({
    walletAddress: request.walletAddress,
    srcChainId: request.srcChainId.toString(),
    destChainId: request.destChainId.toString(),
    srcTokenAddress: request.srcTokenAddress,
    destTokenAddress: request.destTokenAddress,
    srcTokenAmount: request.srcTokenAmount,
    slippage: request.slippage.toString(),
    insufficientBal: request.insufficientBal ? 'true' : 'false',
    resetApproval: request.resetApproval ? 'true' : 'false',
  });
  const url = `${bridgeApiBaseUrl}/getQuote?${queryParams}`;
  const quotes: unknown[] = await fetchFn(url, {
    headers: getClientIdHeader(clientId),
    signal,
  });

  const filteredQuotes = quotes.filter((quoteResponse: unknown) => {
    return validateQuoteResponse(quoteResponse);
  });
  return filteredQuotes as QuoteResponse[];
}

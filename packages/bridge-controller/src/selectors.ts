import { AddressZero } from '@ethersproject/constants';
import type {
  CurrencyRateState,
  MultichainAssetsRatesControllerState,
  TokenRatesControllerState,
} from '@metamask/assets-controllers';
import type { GasFeeEstimates } from '@metamask/gas-fee-controller';
import type { CaipAssetType } from '@metamask/utils';
import { isStrictHexString } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { orderBy } from 'lodash';
import {
  createSelector as createSelector_,
  createStructuredSelector as createStructuredSelector_,
} from 'reselect';

import { BRIDGE_PREFERRED_GAS_ESTIMATE } from './constants/bridge';
import type {
  BridgeControllerState,
  ExchangeRate,
  GenericQuoteRequest,
  QuoteMetadata,
  QuoteResponse,
} from './types';
import { RequestStatus, SortOrder } from './types';
import {
  getNativeAssetForChainId,
  isNativeAddress,
  isSolanaChainId,
} from './utils/bridge';
import {
  formatAddressToAssetId,
  formatChainIdToCaip,
  formatChainIdToHex,
} from './utils/caip-formatters';
import { processFeatureFlags } from './utils/feature-flags';
import {
  calcAdjustedReturn,
  calcCost,
  calcEstimatedAndMaxTotalGasFee,
  calcIncludedTxFees,
  calcRelayerFee,
  calcSentAmount,
  calcSolanaTotalNetworkFee,
  calcSwapRate,
  calcToAmount,
  calcTotalEstimatedNetworkFee,
  calcTotalMaxNetworkFee,
} from './utils/quote';

/**
 * The controller states that provide exchange rates
 */
type ExchangeRateControllerState = MultichainAssetsRatesControllerState &
  TokenRatesControllerState &
  CurrencyRateState &
  Pick<BridgeControllerState, 'assetExchangeRates'>;
/**
 * The state of the bridge controller and all its dependency controllers
 */
type RemoteFeatureFlagControllerState = {
  remoteFeatureFlags: {
    bridgeConfig: unknown;
  };
};
export type BridgeAppState = BridgeControllerState & {
  gasFeeEstimates: GasFeeEstimates;
} & ExchangeRateControllerState & {
    participateInMetaMetrics: boolean;
  } & RemoteFeatureFlagControllerState;
/**
 * Creates a structured selector for the bridge controller
 */
const createStructuredBridgeSelector =
  createStructuredSelector_.withTypes<BridgeAppState>();
/**
 * Creates a typed selector for the bridge controller
 */
const createBridgeSelector = createSelector_.withTypes<BridgeAppState>();
/**
 * Required parameters that clients must provide for the bridge quotes selector
 */
type BridgeQuotesClientParams = {
  sortOrder: SortOrder;
  selectedQuote: (QuoteResponse & QuoteMetadata) | null;
};

const createFeatureFlagsSelector =
  createSelector_.withTypes<RemoteFeatureFlagControllerState>();

/**
 * Selects the bridge feature flags
 *
 * @param state - The state of the bridge controller
 * @returns The bridge feature flags
 *
 * @example
 * ```ts
 * const featureFlags = useSelector(state => selectBridgeFeatureFlags(state));
 *
 * Or
 *
 * export const selectBridgeFeatureFlags = createSelector(
 * selectRemoteFeatureFlags,
 *  (remoteFeatureFlags) =>
 *    selectBridgeFeatureFlagsBase({
 *      bridgeConfig: remoteFeatureFlags.bridgeConfig,
 *    }),
 * );
 * ```
 */
export const selectBridgeFeatureFlags = createFeatureFlagsSelector(
  [(state) => state.remoteFeatureFlags.bridgeConfig],
  (bridgeConfig: unknown) => processFeatureFlags(bridgeConfig),
);

const getExchangeRateByChainIdAndAddress = (
  exchangeRateSources: ExchangeRateControllerState,
  chainId?: GenericQuoteRequest['srcChainId'],
  address?: GenericQuoteRequest['srcTokenAddress'],
): ExchangeRate => {
  if (!chainId || !address) {
    return {};
  }
  // TODO return usd exchange rate if user has opted into metrics
  const assetId = formatAddressToAssetId(address, chainId);
  if (!assetId) {
    return {};
  }

  const { assetExchangeRates, currencyRates, marketData, conversionRates } =
    exchangeRateSources;

  // If the asset exchange rate is available in the bridge controller, use it
  // This is defined if the token's rate is not available from the assets controllers
  const bridgeControllerRate =
    assetExchangeRates?.[assetId] ??
    assetExchangeRates?.[assetId.toLowerCase() as CaipAssetType];
  if (bridgeControllerRate?.exchangeRate) {
    return bridgeControllerRate;
  }
  // If the chain is a Solana chain, use the conversion rate from the multichain assets controller
  if (isSolanaChainId(chainId)) {
    const multichainAssetExchangeRate = conversionRates?.[assetId];
    if (multichainAssetExchangeRate) {
      return {
        exchangeRate: multichainAssetExchangeRate.rate,
        usdExchangeRate: undefined,
      };
    }
    return {};
  }
  // If the chain is an EVM chain, use the conversion rate from the currency rates controller
  if (isNativeAddress(address)) {
    const { symbol } = getNativeAssetForChainId(chainId);
    const evmNativeExchangeRate = currencyRates?.[symbol];
    if (evmNativeExchangeRate) {
      return {
        exchangeRate: evmNativeExchangeRate?.conversionRate?.toString(),
        usdExchangeRate: evmNativeExchangeRate?.usdConversionRate?.toString(),
      };
    }
    return {};
  }
  // If the chain is an EVM chain and the asset is not the native asset, use the conversion rate from the token rates controller
  const evmTokenExchangeRates = marketData?.[formatChainIdToHex(chainId)];
  const evmTokenExchangeRateForAddress = isStrictHexString(address)
    ? evmTokenExchangeRates?.[address]
    : null;
  const nativeCurrencyRate = evmTokenExchangeRateForAddress
    ? currencyRates[evmTokenExchangeRateForAddress?.currency]
    : undefined;
  if (evmTokenExchangeRateForAddress && nativeCurrencyRate) {
    return {
      exchangeRate: new BigNumber(evmTokenExchangeRateForAddress.price)
        .multipliedBy(nativeCurrencyRate.conversionRate ?? 0)
        .toString(),
      usdExchangeRate: new BigNumber(evmTokenExchangeRateForAddress.price)
        .multipliedBy(nativeCurrencyRate.usdConversionRate ?? 0)
        .toString(),
    };
  }

  return {};
};

/**
 * Selects the asset exchange rate for a given chain and address
 *
 * @param state The state of the bridge controller and its dependency controllers
 * @param chainId The chain ID of the asset
 * @param address The address of the asset
 * @returns The asset exchange rate for the given chain and address
 */
export const selectExchangeRateByChainIdAndAddress = (
  state: BridgeAppState,
  chainId?: GenericQuoteRequest['srcChainId'],
  address?: GenericQuoteRequest['srcTokenAddress'],
) => {
  return getExchangeRateByChainIdAndAddress(state, chainId, address);
};

/**
 * Checks whether an exchange rate is available for a given chain and address
 *
 * @param params The parameters to pass to {@link getExchangeRateByChainIdAndAddress}
 * @returns Whether an exchange rate is available for the given chain and address
 */
export const selectIsAssetExchangeRateInState = (
  ...params: Parameters<typeof getExchangeRateByChainIdAndAddress>
) =>
  Boolean(getExchangeRateByChainIdAndAddress(...params)?.exchangeRate) &&
  Boolean(getExchangeRateByChainIdAndAddress(...params)?.usdExchangeRate);

/**
 * Selects the gas fee estimates from the gas fee controller. All potential networks
 * support EIP1559 gas fees so assume that gasFeeEstimates is of type GasFeeEstimates
 *
 * @returns The gas fee estimates in decGWEI
 */
const selectBridgeFeesPerGas = createStructuredBridgeSelector({
  estimatedBaseFeeInDecGwei: ({ gasFeeEstimates }) =>
    gasFeeEstimates?.estimatedBaseFee,
  maxPriorityFeePerGasInDecGwei: ({ gasFeeEstimates }) =>
    gasFeeEstimates?.[BRIDGE_PREFERRED_GAS_ESTIMATE]
      ?.suggestedMaxPriorityFeePerGas,
  maxFeePerGasInDecGwei: ({ gasFeeEstimates }) =>
    gasFeeEstimates?.high?.suggestedMaxFeePerGas,
});

// Selects cross-chain swap quotes including their metadata
const selectBridgeQuotesWithMetadata = createBridgeSelector(
  [
    ({ quotes }) => quotes,
    selectBridgeFeesPerGas,
    createBridgeSelector(
      [
        (state) => state,
        ({ quoteRequest: { srcChainId } }) => srcChainId,
        ({ quoteRequest: { srcTokenAddress } }) => srcTokenAddress,
      ],
      selectExchangeRateByChainIdAndAddress,
    ),
    createBridgeSelector(
      [
        (state) => state,
        ({ quoteRequest: { destChainId } }) => destChainId,
        ({ quoteRequest: { destTokenAddress } }) => destTokenAddress,
      ],
      selectExchangeRateByChainIdAndAddress,
    ),
    createBridgeSelector(
      [(state) => state, ({ quoteRequest: { srcChainId } }) => srcChainId],
      (state, chainId) =>
        selectExchangeRateByChainIdAndAddress(state, chainId, AddressZero),
    ),
  ],
  (
    quotes,
    bridgeFeesPerGas,
    srcTokenExchangeRate,
    destTokenExchangeRate,
    nativeExchangeRate,
  ) => {
    const newQuotes = quotes.map((quote) => {
      const sentAmount = calcSentAmount(quote.quote, srcTokenExchangeRate);
      const toTokenAmount = calcToAmount(quote.quote, destTokenExchangeRate);

      const includedTxFees = calcIncludedTxFees(
        quote.quote,
        srcTokenExchangeRate,
        destTokenExchangeRate,
      );

      let totalEstimatedNetworkFee, gasFee, totalMaxNetworkFee, relayerFee;

      if (isSolanaChainId(quote.quote.srcChainId)) {
        totalEstimatedNetworkFee = calcSolanaTotalNetworkFee(
          quote,
          nativeExchangeRate,
        );
        gasFee = totalEstimatedNetworkFee;
        totalMaxNetworkFee = totalEstimatedNetworkFee;
      } else {
        relayerFee = calcRelayerFee(quote, nativeExchangeRate);
        gasFee = calcEstimatedAndMaxTotalGasFee({
          bridgeQuote: quote,
          ...bridgeFeesPerGas,
          ...nativeExchangeRate,
        });
        totalEstimatedNetworkFee = calcTotalEstimatedNetworkFee(
          gasFee,
          relayerFee,
        );
        totalMaxNetworkFee = calcTotalMaxNetworkFee(gasFee, relayerFee);
      }

      const adjustedReturn = calcAdjustedReturn(
        toTokenAmount,
        totalEstimatedNetworkFee,
        quote.quote,
      );
      const cost = calcCost(adjustedReturn, sentAmount);

      return {
        ...quote,
        // QuoteMetadata fields
        sentAmount,
        toTokenAmount,
        swapRate: calcSwapRate(sentAmount.amount, toTokenAmount.amount),
        totalNetworkFee: totalEstimatedNetworkFee,
        totalMaxNetworkFee,
        gasFee,
        adjustedReturn,
        cost,
        includedTxFees,
      };
    });

    return newQuotes;
  },
);

const selectSortedBridgeQuotes = createBridgeSelector(
  [
    selectBridgeQuotesWithMetadata,
    (_, { sortOrder }: BridgeQuotesClientParams) => sortOrder,
  ],
  (quotesWithMetadata, sortOrder): (QuoteResponse & QuoteMetadata)[] => {
    switch (sortOrder) {
      case SortOrder.ETA_ASC:
        return orderBy(
          quotesWithMetadata,
          (quote) => quote.estimatedProcessingTimeInSeconds,
          'asc',
        );
      default:
        return orderBy(
          quotesWithMetadata,
          ({ cost }) =>
            cost.valueInCurrency ? Number(cost.valueInCurrency) : 0,
          'asc',
        );
    }
  },
);

const selectRecommendedQuote = createBridgeSelector(
  [selectSortedBridgeQuotes],
  (quotes) => (quotes.length > 0 ? quotes[0] : null),
);

const selectActiveQuote = createBridgeSelector(
  [
    selectRecommendedQuote,
    (_, { selectedQuote }: BridgeQuotesClientParams) => selectedQuote,
  ],
  (recommendedQuote, selectedQuote) => selectedQuote ?? recommendedQuote,
);

const selectIsQuoteGoingToRefresh = createBridgeSelector(
  [
    selectBridgeFeatureFlags,
    (state) => state.quoteRequest.insufficientBal,
    (state) => state.quotesRefreshCount,
  ],
  (featureFlags, insufficientBal, quotesRefreshCount) =>
    insufficientBal ? false : featureFlags.maxRefreshCount > quotesRefreshCount,
);

const selectQuoteRefreshRate = createBridgeSelector(
  [selectBridgeFeatureFlags, (state) => state.quoteRequest.srcChainId],
  (featureFlags, srcChainId) =>
    (srcChainId
      ? featureFlags.chains[formatChainIdToCaip(srcChainId)]?.refreshRate
      : featureFlags.refreshRate) ?? featureFlags.refreshRate,
);

export const selectIsQuoteExpired = createBridgeSelector(
  [
    selectIsQuoteGoingToRefresh,
    ({ quotesLastFetched }) => quotesLastFetched,
    selectQuoteRefreshRate,
    (_, __, currentTimeInMs: number) => currentTimeInMs,
  ],
  (isQuoteGoingToRefresh, quotesLastFetched, refreshRate, currentTimeInMs) =>
    Boolean(
      !isQuoteGoingToRefresh &&
        quotesLastFetched &&
        currentTimeInMs - quotesLastFetched > refreshRate,
    ),
);

/**
 * Selects sorted cross-chain swap quotes. By default, the quotes are sorted by cost in ascending order.
 *
 * @param state - The state of the bridge controller and its dependency controllers
 * @param sortOrder - The sort order of the quotes
 * @param selectedQuote - The quote that is currently selected by the user, should be cleared by clients when the req params change
 * @returns The activeQuote, recommendedQuote, sortedQuotes, and other quote fetching metadata
 *
 * @example
 * ```ts
 * const quotes = useSelector(state => selectBridgeQuotes(
 *   { ...state.metamask, bridgeConfig: remoteFeatureFlags.bridgeConfig },
 *   {
 *     sortOrder: state.bridge.sortOrder,
 *     selectedQuote: state.bridge.selectedQuote,
 *   }
 * ));
 * ```
 */
export const selectBridgeQuotes = createStructuredBridgeSelector({
  sortedQuotes: selectSortedBridgeQuotes,
  recommendedQuote: selectRecommendedQuote,
  activeQuote: selectActiveQuote,
  quotesLastFetchedMs: (state) => state.quotesLastFetched,
  isLoading: (state) => state.quotesLoadingStatus === RequestStatus.LOADING,
  quoteFetchError: (state) => state.quoteFetchError,
  quotesRefreshCount: (state) => state.quotesRefreshCount,
  quotesInitialLoadTimeMs: (state) => state.quotesInitialLoadTime,
  isQuoteGoingToRefresh: selectIsQuoteGoingToRefresh,
});

export const selectMinimumBalanceForRentExemptionInSOL = (
  state: BridgeAppState,
) =>
  new BigNumber(state.minimumBalanceForRentExemptionInLamports ?? 0)
    .div(10 ** 9)
    .toString();

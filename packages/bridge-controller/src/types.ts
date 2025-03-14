import type { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import type {
  ControllerStateChangeEvent,
  RestrictedMessenger,
} from '@metamask/base-controller';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import type { Hex } from '@metamask/utils';
import type { BigNumber } from 'bignumber.js';

import type { BridgeController } from './bridge-controller';
import type { BRIDGE_CONTROLLER_NAME } from './constants/bridge';

export type FetchFunction = (
  input: RequestInfo | URL,
  init?: RequestInit,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => Promise<any>;

/**
 * The types of assets that a user can send
 *
 */
export enum AssetType {
  /** The native asset for the current network, such as ETH */
  native = 'NATIVE',
  /** An ERC20 token */
  token = 'TOKEN',
  /** An ERC721 or ERC1155 token. */
  NFT = 'NFT',
  /**
   * A transaction interacting with a contract that isn't a token method
   * interaction will be marked as dealing with an unknown asset type.
   */
  unknown = 'UNKNOWN',
}

export type ChainConfiguration = {
  isActiveSrc: boolean;
  isActiveDest: boolean;
};

export type L1GasFees = {
  l1GasFeesInHexWei?: string; // l1 fees for approval and trade in hex wei, appended by controller
};
// Values derived from the quote response
// valueInCurrency values are calculated based on the user's selected currency

export type QuoteMetadata = {
  gasFee: { amount: BigNumber; valueInCurrency: BigNumber | null };
  totalNetworkFee: { amount: BigNumber; valueInCurrency: BigNumber | null }; // estimatedGasFees + relayerFees
  totalMaxNetworkFee: { amount: BigNumber; valueInCurrency: BigNumber | null }; // maxGasFees + relayerFees
  toTokenAmount: { amount: BigNumber; valueInCurrency: BigNumber | null };
  adjustedReturn: { valueInCurrency: BigNumber | null }; // destTokenAmount - totalNetworkFee
  sentAmount: { amount: BigNumber; valueInCurrency: BigNumber | null }; // srcTokenAmount + metabridgeFee
  swapRate: BigNumber; // destTokenAmount / sentAmount
  cost: { valueInCurrency: BigNumber | null }; // sentAmount - adjustedReturn
};
// Sort order set by the user

export enum SortOrder {
  COST_ASC = 'cost_ascending',
  ETA_ASC = 'time_descending',
}

export type BridgeToken = {
  type: AssetType.native | AssetType.token;
  address: string;
  symbol: string;
  image: string;
  decimals: number;
  chainId: Hex;
  balance: string; // raw balance
  string: string | undefined; // normalized balance as a stringified number
  tokenFiatAmount?: number | null;
} | null;
// Types copied from Metabridge API

export enum BridgeFlag {
  EXTENSION_CONFIG = 'extension-config',
  MOBILE_CONFIG = 'mobile-config',
}
type DecimalChainId = string;
export type GasMultiplierByChainId = Record<DecimalChainId, number>;

type FeatureFlagResponsePlatformConfig = {
  refreshRate: number;
  maxRefreshCount: number;
  support: boolean;
  chains: Record<string, ChainConfiguration>;
};

export type FeatureFlagResponse = {
  [BridgeFlag.EXTENSION_CONFIG]: FeatureFlagResponsePlatformConfig;
  [BridgeFlag.MOBILE_CONFIG]: FeatureFlagResponsePlatformConfig;
};

export type BridgeAsset = {
  chainId: ChainId;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
};

export type QuoteRequest = {
  walletAddress: string;
  destWalletAddress?: string;
  srcChainId: ChainId;
  destChainId: ChainId;
  srcTokenAddress: string;
  destTokenAddress: string;
  /**
   * This is the amount sent, in atomic amount
   */
  srcTokenAmount: string;
  slippage: number;
  aggIds?: string[];
  bridgeIds?: string[];
  insufficientBal?: boolean;
  resetApproval?: boolean;
  refuel?: boolean;
};

export type Protocol = {
  name: string;
  displayName?: string;
  icon?: string;
};

export enum ActionTypes {
  BRIDGE = 'bridge',
  SWAP = 'swap',
  REFUEL = 'refuel',
}

export type Step = {
  action: ActionTypes;
  srcChainId: ChainId;
  destChainId?: ChainId;
  srcAsset: BridgeAsset;
  destAsset: BridgeAsset;
  srcAmount: string;
  destAmount: string;
  protocol: Protocol;
};

export type RefuelData = Step;

export type Quote = {
  requestId: string;
  srcChainId: ChainId;
  srcAsset: BridgeAsset;
  // Some tokens have a fee of 0, so sometimes it's equal to amount sent
  srcTokenAmount: string; // Atomic amount, the amount sent - fees
  destChainId: ChainId;
  destAsset: BridgeAsset;
  destTokenAmount: string; // Atomic amount, the amount received
  feeData: Record<FeeType.METABRIDGE, FeeData> &
    Partial<Record<FeeType, FeeData>>;
  bridgeId: string;
  bridges: string[];
  steps: Step[];
  refuel?: RefuelData;
};

export type QuoteResponse = {
  quote: Quote;
  approval?: TxData | null;
  trade: TxData;
  estimatedProcessingTimeInSeconds: number;
};

export enum ChainId {
  ETH = 1,
  OPTIMISM = 10,
  BSC = 56,
  POLYGON = 137,
  ZKSYNC = 324,
  BASE = 8453,
  ARBITRUM = 42161,
  AVALANCHE = 43114,
  LINEA = 59144,
}

export enum FeeType {
  METABRIDGE = 'metabridge',
  REFUEL = 'refuel',
}
export type FeeData = {
  amount: string;
  asset: BridgeAsset;
};
export type TxData = {
  chainId: ChainId;
  to: string;
  from: string;
  value: string;
  data: string;
  gasLimit: number | null;
};
export enum BridgeFeatureFlagsKey {
  EXTENSION_CONFIG = 'extensionConfig',
  MOBILE_CONFIG = 'mobileConfig',
}

type FeatureFlagsPlatformConfig = {
  refreshRate: number;
  maxRefreshCount: number;
  support: boolean;
  chains: Record<Hex, ChainConfiguration>;
};

export type BridgeFeatureFlags = {
  [BridgeFeatureFlagsKey.EXTENSION_CONFIG]: FeatureFlagsPlatformConfig;
  [BridgeFeatureFlagsKey.MOBILE_CONFIG]: FeatureFlagsPlatformConfig;
};
export enum RequestStatus {
  LOADING,
  FETCHED,
  ERROR,
}
export enum BridgeUserAction {
  SELECT_DEST_NETWORK = 'selectDestNetwork',
  UPDATE_QUOTE_PARAMS = 'updateBridgeQuoteRequestParams',
}
export enum BridgeBackgroundAction {
  SET_FEATURE_FLAGS = 'setBridgeFeatureFlags',
  RESET_STATE = 'resetState',
  GET_BRIDGE_ERC20_ALLOWANCE = 'getBridgeERC20Allowance',
}
export type BridgeControllerState = {
  bridgeFeatureFlags: BridgeFeatureFlags;
  quoteRequest: Partial<QuoteRequest>;
  quotes: (QuoteResponse & L1GasFees)[];
  quotesInitialLoadTime: number | null;
  quotesLastFetched: number | null;
  quotesLoadingStatus: RequestStatus | null;
  quoteFetchError: string | null;
  quotesRefreshCount: number;
};

export type BridgeControllerAction<
  FunctionName extends keyof BridgeController,
> = {
  type: `${typeof BRIDGE_CONTROLLER_NAME}:${FunctionName}`;
  handler: BridgeController[FunctionName];
};

// Maps to BridgeController function names
export type BridgeControllerActions =
  | BridgeControllerAction<BridgeBackgroundAction.SET_FEATURE_FLAGS>
  | BridgeControllerAction<BridgeBackgroundAction.RESET_STATE>
  | BridgeControllerAction<BridgeBackgroundAction.GET_BRIDGE_ERC20_ALLOWANCE>
  | BridgeControllerAction<BridgeUserAction.UPDATE_QUOTE_PARAMS>;

export type BridgeControllerEvents = ControllerStateChangeEvent<
  typeof BRIDGE_CONTROLLER_NAME,
  BridgeControllerState
>;

export type AllowedActions =
  | AccountsControllerGetSelectedAccountAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction;
export type AllowedEvents = never;

/**
 * The messenger for the BridgeController.
 */
export type BridgeControllerMessenger = RestrictedMessenger<
  typeof BRIDGE_CONTROLLER_NAME,
  BridgeControllerActions | AllowedActions,
  BridgeControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

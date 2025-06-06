import type { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import type { AddApprovalRequest } from '@metamask/approval-controller';
import type { RestrictedMessenger } from '@metamask/base-controller';
import { BaseController } from '@metamask/base-controller';
import {
  toChecksumHexAddress,
  ChainId,
  NFT_API_BASE_URL,
  NFT_API_VERSION,
  convertHexToDecimal,
  handleFetch,
  fetchWithErrorHandling,
  NFT_API_TIMEOUT,
  toHex,
} from '@metamask/controller-utils';
import type {
  NetworkClient,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerStateChangeEvent,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import type {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
  PreferencesState,
} from '@metamask/preferences-controller';
import { createDeferredPromise, type Hex } from '@metamask/utils';

import { reduceInBatchesSerially } from './assetsUtil';
import { Source } from './constants';
import {
  type NftController,
  type NftControllerState,
  type NftMetadata,
} from './NftController';
import type { NetworkControllerFindNetworkClientIdByChainIdAction } from '../../network-controller/src/NetworkController';

const controllerName = 'NftDetectionController';

export type NFTDetectionControllerState = Record<never, never>;

export type AllowedActions =
  | AddApprovalRequest
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | PreferencesControllerGetStateAction
  | AccountsControllerGetSelectedAccountAction
  | NetworkControllerFindNetworkClientIdByChainIdAction;

export type AllowedEvents =
  | PreferencesControllerStateChangeEvent
  | NetworkControllerStateChangeEvent;

export type NftDetectionControllerMessenger = RestrictedMessenger<
  typeof controllerName,
  AllowedActions,
  AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

/**
 * A set of supported networks for NFT detection.
 */
const supportedNftDetectionNetworks: Set<Hex> = new Set([
  // TODO: We should consider passing this constant from the NftDetectionController contructor
  // to reduce the complexity to add further network into this constant
  '0x1', // Mainnet
  '0xe708', // Linea Mainnet
  '0x531', // Sei
]);

/**
 * @type ApiNft
 *
 * NFT object coming from OpenSea api
 * @property token_id - The NFT identifier
 * @property num_sales - Number of sales
 * @property background_color - The background color to be displayed with the item
 * @property image_url - URI of an image associated with this NFT
 * @property image_preview_url - URI of a smaller image associated with this NFT
 * @property image_thumbnail_url - URI of a thumbnail image associated with this NFT
 * @property image_original_url - URI of the original image associated with this NFT
 * @property animation_url - URI of a animation associated with this NFT
 * @property animation_original_url - URI of the original animation associated with this NFT
 * @property name - The NFT name
 * @property description - The NFT description
 * @property external_link - External link containing additional information
 * @property assetContract - The NFT contract information object
 * @property creator - The NFT owner information object
 * @property lastSale - When this item was last sold
 */
export type ApiNft = {
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  token_id: string;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  num_sales: number | null;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  background_color: string | null;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  image_url: string | null;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  image_preview_url: string | null;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  image_thumbnail_url: string | null;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  image_original_url: string | null;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  animation_url: string | null;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  animation_original_url: string | null;
  name: string | null;
  description: string | null;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  external_link: string | null;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  asset_contract: ApiNftContract;
  creator: ApiNftCreator;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  last_sale: ApiNftLastSale | null;
};

/**
 * @type ApiNftContract
 *
 * NFT contract object coming from OpenSea api
 * @property address - Address of the NFT contract
 * @property asset_contract_type - The NFT type, it could be `semi-fungible` or `non-fungible`
 * @property created_date - Creation date
 * @property collection - Object containing the contract name and URI of an image associated
 * @property schema_name - The schema followed by the contract, it could be `ERC721` or `ERC1155`
 * @property symbol - The NFT contract symbol
 * @property total_supply - Total supply of NFTs
 * @property description - The NFT contract description
 * @property external_link - External link containing additional information
 */
export type ApiNftContract = {
  address: string;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  asset_contract_type: string | null;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  created_date: string | null;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  schema_name: string | null;
  symbol: string | null;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  total_supply: string | null;
  description: string | null;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  external_link: string | null;
  collection: {
    name: string | null;
    // TODO: Either fix this lint violation or explain why it's necessary to ignore.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    image_url?: string | null;
    tokenCount?: string | null;
  };
};

/**
 * @type ApiNftLastSale
 *
 * NFT sale object coming from OpenSea api
 * @property event_timestamp - Object containing a `username`
 * @property total_price - URI of NFT image associated with this owner
 * @property transaction - Object containing transaction_hash and block_hash
 */
export type ApiNftLastSale = {
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  event_timestamp: string;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  total_price: string;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transaction: { transaction_hash: string; block_hash: string };
};

/**
 * @type ApiNftCreator
 *
 * NFT creator object coming from OpenSea api
 * @property user - Object containing a `username`
 * @property profile_img_url - URI of NFT image associated with this owner
 * @property address - The owner address
 */
export type ApiNftCreator = {
  user: { username: string };
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  profile_img_url: string;
  address: string;
};

export type ReservoirResponse = {
  tokens: TokensResponse[];
  continuation?: string;
};

export type TokensResponse = {
  token: TokenResponse;
  ownership: Ownership;
  market?: Market;
  blockaidResult?: Blockaid;
};

export enum BlockaidResultType {
  Benign = 'Benign',
  Spam = 'Spam',
  Warning = 'Warning',
  Malicious = 'Malicious',
}

export type Blockaid = {
  contract: string;
  chainId: number;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  result_type: BlockaidResultType;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  malicious_score: string;
  // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  attack_types: object;
};

export type Market = {
  floorAsk?: FloorAsk;
  topBid?: TopBid;
};

export type TokenResponse = {
  chainId: number;
  contract: string;
  tokenId: string;
  kind?: string;
  name?: string;
  image?: string;
  imageSmall?: string;
  imageLarge?: string;
  metadata?: Metadata;
  description?: string;
  supply?: number;
  remainingSupply?: number;
  rarityScore?: number;
  rarity?: number;
  rarityRank?: number;
  media?: string;
  isFlagged?: boolean;
  isSpam?: boolean;
  isNsfw?: boolean;
  metadataDisabled?: boolean;
  lastFlagUpdate?: string;
  lastFlagChange?: string;
  collection?: Collection;
  lastSale?: LastSale;
  topBid?: TopBid;
  lastAppraisalValue?: number;
  attributes?: Attributes[];
};

export type TopBid = {
  id?: string;
  price?: Price;
  source?: {
    id?: string;
    domain?: string;
    name?: string;
    icon?: string;
    url?: string;
  };
};

export type LastSale = {
  saleId?: string;
  token?: {
    contract?: string;
    tokenId?: string;
    name?: string;
    image?: string;
    collection?: {
      id?: string;
      name?: string;
    };
  };
  orderSource?: string;
  orderSide?: 'ask' | 'bid';
  orderKind?: string;
  orderId?: string;
  from?: string;
  to?: string;
  amount?: string;
  fillSource?: string;
  block?: number;
  txHash?: string;
  logIndex?: number;
  batchIndex?: number;
  timestamp?: number;
  price?: Price;
  washTradingScore?: number;
  royaltyFeeBps?: number;
  marketplaceFeeBps?: number;
  paidFullRoyalty?: boolean;
  feeBreakdown?: FeeBreakdown[];
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type FeeBreakdown = {
  kind?: string;
  bps?: number;
  recipient?: string;
  source?: string;
  rawAmount?: string;
};

export type Attributes = {
  key?: string;
  kind?: string;
  value: string;
  tokenCount?: number;
  onSaleCount?: number;
  floorAskPrice?: Price | null;
  topBidValue?: number | null;
  createdAt?: string;
};

export type GetCollectionsResponse = {
  collections: CollectionResponse[];
};

export type CollectionResponse = {
  id?: string;
  chainId?: number;
  openseaVerificationStatus?: string;
  contractDeployedAt?: string;
  creator?: string;
  ownerCount?: string;
  topBid?: TopBid & {
    sourceDomain?: string;
  };
};

export type FloorAskCollection = {
  id?: string;
  price?: Price;
  maker?: string;
  kind?: string;
  validFrom?: number;
  validUntil?: number;
  source?: SourceCollection;
  rawData?: Metadata;
  isNativeOffChainCancellable?: boolean;
};

export type SourceCollection = {
  id: string;
  domain: string;
  name: string;
  icon: string;
  url: string;
};

export type TokenCollection = {
  id?: string;
  name?: string;
  slug?: string;
  symbol?: string;
  imageUrl?: string;
  image?: string;
  isSpam?: boolean;
  isNsfw?: boolean;
  creator?: string;
  tokenCount?: string;
  metadataDisabled?: boolean;
  openseaVerificationStatus?: string;
  floorAskPrice?: Price;
  royaltiesBps?: number;
  royalties?: Royalties[];
  floorAsk?: FloorAskCollection;
};

export type Collection = TokenCollection & CollectionResponse;

export type Royalties = {
  bps?: number;
  recipient?: string;
};

export type Ownership = {
  tokenCount?: string;
  onSaleCount?: string;
  floorAsk?: FloorAsk;
  acquiredAt?: string;
};

export type FloorAsk = {
  id?: string;
  price?: Price;
  maker?: string;
  kind?: string;
  validFrom?: number;
  validUntil?: number;
  source?: Source;
  rawData?: Metadata;
  isNativeOffChainCancellable?: boolean;
};

export type Price = {
  currency?: {
    contract?: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    chainId?: number;
  };
  amount?: {
    raw?: string;
    decimal?: number;
    usd?: number;
    native?: number;
  };
  netAmount?: {
    raw?: string;
    decimal?: number;
    usd?: number;
    native?: number;
  };
};

export type Metadata = {
  imageOriginal?: string;
  tokenURI?: string;
};

export const MAX_GET_COLLECTION_BATCH_SIZE = 20;

/**
 * Controller that passively detects nfts for a user address
 */
export class NftDetectionController extends BaseController<
  typeof controllerName,
  NFTDetectionControllerState,
  NftDetectionControllerMessenger
> {
  #disabled: boolean;

  readonly #addNft: NftController['addNft'];

  readonly #getNftState: () => NftControllerState;

  #inProcessNftFetchingUpdates: Record<`${string}:${string}`, Promise<void>>;

  /**
   * The controller options
   *
   * @param options - The controller options.
   * @param options.messenger - A reference to the messaging system.
   * @param options.disabled - Represents previous value of useNftDetection. Used to detect changes of useNftDetection. Default value is true.
   * @param options.addNft - Add an NFT.
   * @param options.getNftState - Gets the current state of the Assets controller.
   */
  constructor({
    messenger,
    disabled = false,
    addNft,
    getNftState,
  }: {
    messenger: NftDetectionControllerMessenger;
    disabled: boolean;
    addNft: NftController['addNft'];
    getNftState: () => NftControllerState;
  }) {
    super({
      name: controllerName,
      messenger,
      metadata: {},
      state: {},
    });
    this.#disabled = disabled;
    this.#inProcessNftFetchingUpdates = {};

    this.#getNftState = getNftState;
    this.#addNft = addNft;

    this.messagingSystem.subscribe(
      'PreferencesController:stateChange',
      this.#onPreferencesControllerStateChange.bind(this),
    );
  }

  /**
   * Checks whether network is mainnet or not.
   *
   * @returns Whether current network is mainnet.
   */
  isMainnet(): boolean {
    const { selectedNetworkClientId } = this.messagingSystem.call(
      'NetworkController:getState',
    );
    const {
      configuration: { chainId },
    } = this.messagingSystem.call(
      'NetworkController:getNetworkClientById',
      selectedNetworkClientId,
    );
    return chainId === ChainId.mainnet;
  }

  isMainnetByNetworkClientId(networkClient: NetworkClient): boolean {
    return networkClient.configuration.chainId === ChainId.mainnet;
  }

  /**
   * Handles the state change of the preference controller.
   * @param preferencesState - The new state of the preference controller.
   * @param preferencesState.useNftDetection - Boolean indicating user preference on NFT detection.
   */
  #onPreferencesControllerStateChange({ useNftDetection }: PreferencesState) {
    if (!useNftDetection !== this.#disabled) {
      this.#disabled = !useNftDetection;
    }
  }

  #getOwnerNftApi({
    chainIds,
    address,
    next,
  }: {
    chainIds: string[];
    address: string;
    next?: string;
  }) {
    // from chainIds construct a string of chainIds that can be used like chainIds=1&chainIds=56
    const chainIdsString = chainIds.join('&chainIds=');
    return `${
      NFT_API_BASE_URL as string
    }/users/${address}/tokens?chainIds=${chainIdsString}&limit=50&includeTopBid=true&continuation=${next ?? ''}`;
  }

  async #getOwnerNfts(
    address: string,
    chainIds: Hex[],
    cursor: string | undefined,
  ) {
    // Convert hex chainId to number
    const convertedChainIds = chainIds.map((chainId) =>
      convertHexToDecimal(chainId).toString(),
    );
    const url = this.#getOwnerNftApi({
      chainIds: convertedChainIds,
      address,
      next: cursor,
    });
    const nftApiResponse: ReservoirResponse = await handleFetch(url, {
      headers: {
        Version: NFT_API_VERSION,
      },
    });
    return nftApiResponse;
  }

  /**
   * Triggers asset ERC721 token auto detection on mainnet. Any newly detected NFTs are
   * added.
   *
   * @param chainIds - The chain IDs to detect NFTs on.
   * @param options - Options bag.
   * @param options.userAddress - The address to detect NFTs for.
   */
  async detectNfts(chainIds: Hex[], options?: { userAddress?: string }) {
    const userAddress =
      options?.userAddress ??
      this.messagingSystem.call('AccountsController:getSelectedAccount')
        .address;

    // filter out unsupported chainIds
    const supportedChainIds = chainIds.filter((chainId) =>
      supportedNftDetectionNetworks.has(chainId),
    );
    /* istanbul ignore if */
    if (supportedChainIds.length === 0 || this.#disabled) {
      return;
    }
    /* istanbul ignore else */
    if (!userAddress) {
      return;
    }
    // create a string of all chainIds
    const chainIdsString = chainIds.join(',');

    const updateKey: `${string}:${string}` = `${chainIdsString}:${userAddress}`;
    if (updateKey in this.#inProcessNftFetchingUpdates) {
      // This prevents redundant updates
      // This promise is resolved after the in-progress update has finished,
      // and state has been updated.
      await this.#inProcessNftFetchingUpdates[updateKey];
      return;
    }

    const {
      promise: inProgressUpdate,
      resolve: updateSucceeded,
      reject: updateFailed,
    } = createDeferredPromise({ suppressUnhandledRejection: true });
    this.#inProcessNftFetchingUpdates[updateKey] = inProgressUpdate;

    let next;
    let apiNfts: TokensResponse[] = [];
    let resultNftApi: ReservoirResponse;
    try {
      do {
        resultNftApi = await this.#getOwnerNfts(
          userAddress,
          supportedChainIds,
          next,
        );
        apiNfts = resultNftApi.tokens.filter(
          (elm) =>
            elm.token.isSpam === false &&
            (elm.blockaidResult?.result_type
              ? elm.blockaidResult?.result_type === BlockaidResultType.Benign
              : true),
        );
        // Retrieve collections from apiNfts
        // contract and collection.id are equal for simple contract addresses; this is to exclude cases for shared contracts
        const collections = apiNfts.reduce<Record<string, string[]>>(
          (acc, currValue) => {
            if (
              !acc[currValue.token.chainId]?.includes(
                currValue.token.contract,
              ) &&
              currValue.token.contract === currValue?.token?.collection?.id
            ) {
              if (!acc[currValue.token.chainId]) {
                acc[currValue.token.chainId] = [];
              }
              acc[currValue.token.chainId].push(currValue.token.contract);
            }
            return acc;
          },
          {} as Record<string, string[]>,
        );

        if (
          Object.values(collections).some((contracts) => contracts.length > 0)
        ) {
          // Call API to retrieve collections infos
          // The api accept a max of 20 contracts
          const collectionsResponses = await Promise.all(
            Object.entries(collections).map(([chainId, contracts]) =>
              reduceInBatchesSerially({
                values: contracts,
                batchSize: MAX_GET_COLLECTION_BATCH_SIZE,
                eachBatch: async (allResponses, batch) => {
                  const params = new URLSearchParams(
                    batch.map((s) => ['contract', s]),
                  );
                  params.append('chainId', chainId);
                  const collectionResponseForBatch =
                    await fetchWithErrorHandling({
                      url: `${
                        NFT_API_BASE_URL as string
                      }/collections?${params.toString()}`,
                      options: {
                        headers: {
                          Version: NFT_API_VERSION,
                        },
                      },
                      timeout: NFT_API_TIMEOUT,
                    });

                  return {
                    ...allResponses,
                    ...collectionResponseForBatch,
                  };
                },
                initialResult: {},
              }),
            ),
          );
          // create a new collectionsResponse that is of type GetCollectionsResponse and merges the results of collectionsResponses
          const collectionResponse: GetCollectionsResponse = {
            collections: [],
          };

          collectionsResponses.forEach((singleCollectionResponse) => {
            if (
              (singleCollectionResponse as GetCollectionsResponse)?.collections
            ) {
              collectionResponse?.collections.push(
                ...(singleCollectionResponse as GetCollectionsResponse)
                  .collections,
              );
            }
          });

          // Add collections response fields to  newnfts
          if (collectionResponse.collections?.length) {
            apiNfts.forEach((singleNFT) => {
              const found = collectionResponse.collections.find(
                (elm) =>
                  elm.id?.toLowerCase() ===
                    singleNFT.token.contract.toLowerCase() &&
                  singleNFT.token.chainId === elm.chainId,
              );
              if (found) {
                singleNFT.token = {
                  ...singleNFT.token,
                  collection: {
                    ...(singleNFT.token.collection ?? {}),
                    openseaVerificationStatus: found?.openseaVerificationStatus,
                    contractDeployedAt: found.contractDeployedAt,
                    creator: found?.creator,
                    ownerCount: found.ownerCount,
                    topBid: found.topBid,
                  },
                };
              }
            });
          }
        }

        // Proceed to add NFTs
        const addNftPromises = apiNfts.map(async (nft) => {
          const {
            tokenId,
            contract,
            kind,
            image: imageUrl,
            imageSmall: imageThumbnailUrl,
            metadata,
            name,
            description,
            attributes,
            topBid,
            lastSale,
            rarityRank,
            rarityScore,
            collection,
            chainId,
          } = nft.token;

          // Use a fallback if metadata is null
          const { imageOriginal: imageOriginalUrl } = metadata || {};

          let ignored;
          /* istanbul ignore else */
          const { ignoredNfts } = this.#getNftState();
          if (ignoredNfts.length) {
            ignored = ignoredNfts.find((c) => {
              /* istanbul ignore next */
              return (
                c.address === toChecksumHexAddress(contract) &&
                c.tokenId === tokenId
              );
            });
          }

          /* istanbul ignore else */
          if (!ignored) {
            /* istanbul ignore next */
            const nftMetadata: NftMetadata = Object.assign(
              {},
              { name },
              description && { description },
              imageUrl && { image: imageUrl },
              imageThumbnailUrl && { imageThumbnail: imageThumbnailUrl },
              imageOriginalUrl && { imageOriginal: imageOriginalUrl },
              kind && { standard: kind.toUpperCase() },
              lastSale && { lastSale },
              attributes && { attributes },
              topBid && { topBid },
              rarityRank && { rarityRank },
              rarityScore && { rarityScore },
              collection && { collection },
              chainId && { chainId },
            );
            const networkClientId = this.messagingSystem.call(
              'NetworkController:findNetworkClientIdByChainId',
              toHex(chainId),
            );
            await this.#addNft(contract, tokenId, networkClientId, {
              nftMetadata,
              userAddress,
              source: Source.Detected,
            });
          }
        });
        await Promise.all(addNftPromises);
      } while ((next = resultNftApi.continuation));
      updateSucceeded();
    } catch (error) {
      updateFailed(error);
      throw error;
    } finally {
      delete this.#inProcessNftFetchingUpdates[updateKey];
    }
  }
}

export default NftDetectionController;

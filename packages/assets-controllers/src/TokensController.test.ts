import { Contract } from '@ethersproject/contracts';
import type { ApprovalStateChange } from '@metamask/approval-controller';
import {
  ApprovalController,
  type ApprovalControllerState,
} from '@metamask/approval-controller';
import { Messenger } from '@metamask/base-controller';
import contractMaps from '@metamask/contract-metadata';
import {
  ApprovalType,
  ChainId,
  ORIGIN_METAMASK,
  convertHexToDecimal,
  InfuraNetworkType,
} from '@metamask/controller-utils';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type {
  NetworkClientConfiguration,
  NetworkClientId,
  NetworkState,
} from '@metamask/network-controller';
import { getDefaultNetworkControllerState } from '@metamask/network-controller';
import type { Patch } from 'immer';
import nock from 'nock';
import * as sinon from 'sinon';
import { v1 as uuidV1 } from 'uuid';

import { FakeProvider } from '../../../tests/fake-provider';
import { createMockInternalAccount } from '../../accounts-controller/src/tests/mocks';
import type {
  ExtractAvailableAction,
  ExtractAvailableEvent,
} from '../../base-controller/tests/helpers';
import {
  buildCustomNetworkClientConfiguration,
  buildMockGetNetworkClientById,
} from '../../network-controller/tests/helpers';
import { ERC20Standard } from './Standards/ERC20Standard';
import { ERC1155Standard } from './Standards/NftStandards/ERC1155/ERC1155Standard';
import { TOKEN_END_POINT_API } from './token-service';
import type { Token } from './TokenRatesController';
import { TokensController } from './TokensController';
import type {
  AllowedActions,
  AllowedEvents,
  TokensControllerMessenger,
  TokensControllerState,
} from './TokensController';

jest.mock('@ethersproject/contracts');
jest.mock('uuid', () => ({
  ...jest.requireActual('uuid'),
  v1: jest.fn(),
}));
jest.mock('./Standards/ERC20Standard');
jest.mock('./Standards/NftStandards/ERC1155/ERC1155Standard');

type UnrestrictedMessenger = Messenger<
  ExtractAvailableAction<TokensControllerMessenger>,
  ExtractAvailableEvent<TokensControllerMessenger> | ApprovalStateChange
>;

const ContractMock = jest.mocked(Contract);
const uuidV1Mock = jest.mocked(uuidV1);
const ERC20StandardMock = jest.mocked(ERC20Standard);
const ERC1155StandardMock = jest.mocked(ERC1155Standard);

const defaultMockInternalAccount = createMockInternalAccount({
  address: '0x1',
});

describe('TokensController', () => {
  beforeEach(() => {
    uuidV1Mock.mockReturnValue('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
    ContractMock.mockReturnValue(
      buildMockEthersERC721Contract({ supportsInterface: false }),
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should set default state', async () => {
    await withController(({ controller }) => {
      expect(controller.state).toStrictEqual({
        allTokens: {},
        allIgnoredTokens: {},
        allDetectedTokens: {},
      });
    });
  });

  it('should add a token', async () => {
    await withController(async ({ controller }) => {
      ContractMock.mockReturnValue(
        buildMockEthersERC721Contract({ supportsInterface: false }),
      );

      await controller.addToken({
        address: '0x01',
        symbol: 'bar',
        decimals: 2,
        networkClientId: 'mainnet',
      });
      expect(
        controller.state.allTokens[ChainId.mainnet][
          defaultMockInternalAccount.address
        ][0],
      ).toStrictEqual({
        address: '0x01',
        decimals: 2,
        image: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x01.png',
        symbol: 'bar',
        isERC721: false,
        aggregators: [],
        name: undefined,
      });

      await controller.addToken({
        address: '0x02',
        symbol: 'baz',
        decimals: 2,
        networkClientId: 'mainnet',
      });
      expect(
        controller.state.allTokens[ChainId.mainnet][
          defaultMockInternalAccount.address
        ][1],
      ).toStrictEqual({
        address: '0x02',
        decimals: 2,
        image: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x02.png',
        symbol: 'baz',
        isERC721: false,
        aggregators: [],
        name: undefined,
      });
    });
  });

  it('should add tokens', async () => {
    await withController(async ({ controller }) => {
      await controller.addTokens(
        [
          {
            address: '0x01',
            symbol: 'barA',
            decimals: 2,
            aggregators: [],
            name: 'Token1',
          },
          {
            address: '0x02',
            symbol: 'barB',
            decimals: 2,
            aggregators: [],
            name: 'Token2',
          },
        ],
        'mainnet',
      );
      expect(
        controller.state.allTokens[ChainId.mainnet][
          defaultMockInternalAccount.address
        ][0],
      ).toStrictEqual({
        address: '0x01',
        decimals: 2,
        image: undefined,
        symbol: 'barA',
        aggregators: [],
        name: 'Token1',
      });
      expect(
        controller.state.allTokens[ChainId.mainnet][
          defaultMockInternalAccount.address
        ][1],
      ).toStrictEqual({
        address: '0x02',
        decimals: 2,
        image: undefined,
        symbol: 'barB',
        aggregators: [],
        name: 'Token2',
      });

      await controller.addTokens(
        [
          {
            address: '0x01',
            symbol: 'bazA',
            decimals: 2,
            aggregators: [],
          },
          {
            address: '0x02',
            symbol: 'bazB',
            decimals: 2,
            aggregators: [],
          },
        ],
        'mainnet',
      );
      expect(
        controller.state.allTokens[ChainId.mainnet][
          defaultMockInternalAccount.address
        ][0],
      ).toStrictEqual({
        address: '0x01',
        decimals: 2,
        image: undefined,
        symbol: 'bazA',
        aggregators: [],
        name: undefined,
      });
      expect(
        controller.state.allTokens[ChainId.mainnet][
          defaultMockInternalAccount.address
        ][1],
      ).toStrictEqual({
        address: '0x02',
        decimals: 2,
        image: undefined,
        symbol: 'bazB',
        aggregators: [],
        name: undefined,
      });
    });
  });

  it('should add tokens and update existing ones and detected tokens', async () => {
    const selectedAddress = '0x0001';
    const selectedAccount = createMockInternalAccount({
      address: selectedAddress,
    });
    await withController(
      {
        mockNetworkClientConfigurationsByNetworkClientId: {
          networkClientId1: buildCustomNetworkClientConfiguration({
            chainId: '0x1',
          }),
        },
        mocks: {
          getSelectedAccount: selectedAccount,
          getAccount: selectedAccount,
        },
      },
      async ({ controller }) => {
        await controller.addDetectedTokens(
          [
            {
              address: '0x01',
              symbol: 'barA',
              decimals: 2,
            },
          ],
          {
            selectedAddress: '0x0001',
            chainId: '0x1',
          },
        );

        await controller.addTokens(
          [
            {
              address: '0x01',
              symbol: 'barA',
              decimals: 2,
              aggregators: [],
              name: 'Token1',
            },
            {
              address: '0x02',
              symbol: 'barB',
              decimals: 2,
              aggregators: [],
              name: 'Token2',
            },
          ],
          'networkClientId1',
        );

        expect(controller.state.allTokens).toStrictEqual({
          '0x1': {
            '0x0001': [
              {
                address: '0x01',
                symbol: 'barA',
                decimals: 2,
                aggregators: [],
                name: 'Token1',
                image: undefined,
              },
              {
                address: '0x02',
                symbol: 'barB',
                decimals: 2,
                aggregators: [],
                name: 'Token2',
                image: undefined,
              },
            ],
          },
        });
      },
    );
  });

  it('should not add detected tokens if token is already imported', async () => {
    await withController(async ({ controller }) => {
      await controller.addToken({
        address: '0x01',
        symbol: 'bar',
        decimals: 2,
        networkClientId: 'mainnet',
      });

      await controller.addDetectedTokens(
        [{ address: '0x01', symbol: 'barA', decimals: 2 }],
        {
          selectedAddress: '0x0001',
          chainId: '0x1',
        },
      );

      expect(
        controller.state.allDetectedTokens[ChainId.mainnet]?.[
          defaultMockInternalAccount.address
        ],
      ).toBeUndefined();
    });
  });

  it('should add detected tokens', async () => {
    await withController(async ({ controller }) => {
      await controller.addDetectedTokens(
        [
          {
            address: '0x01',
            symbol: 'barA',
            decimals: 2,
            aggregators: [],
          },
          {
            address: '0x02',
            symbol: 'barB',
            decimals: 2,
            aggregators: [],
          },
        ],
        {
          chainId: ChainId.mainnet,
        },
      );
      expect(
        controller.state.allDetectedTokens[ChainId.mainnet][
          defaultMockInternalAccount.address
        ][0],
      ).toStrictEqual({
        address: '0x01',
        decimals: 2,
        image: undefined,
        symbol: 'barA',
        aggregators: [],
        isERC721: undefined,
        name: undefined,
      });
      expect(
        controller.state.allDetectedTokens[ChainId.mainnet][
          defaultMockInternalAccount.address
        ][1],
      ).toStrictEqual({
        address: '0x02',
        decimals: 2,
        image: undefined,
        symbol: 'barB',
        aggregators: [],
        isERC721: undefined,
        name: undefined,
      });

      await controller.addDetectedTokens(
        [
          {
            address: '0x01',
            symbol: 'bazA',
            decimals: 2,
            aggregators: [],
            isERC721: undefined,
            name: undefined,
          },
          {
            address: '0x02',
            symbol: 'bazB',
            decimals: 2,
            aggregators: [],
            isERC721: undefined,
            name: undefined,
          },
        ],
        {
          chainId: ChainId.mainnet,
        },
      );
      expect(
        controller.state.allDetectedTokens[ChainId.mainnet][
          defaultMockInternalAccount.address
        ][0],
      ).toStrictEqual({
        address: '0x01',
        decimals: 2,
        image: undefined,
        symbol: 'bazA',
        aggregators: [],
        isERC721: undefined,
        name: undefined,
      });
      expect(
        controller.state.allDetectedTokens[ChainId.mainnet][
          defaultMockInternalAccount.address
        ][1],
      ).toStrictEqual({
        address: '0x02',
        decimals: 2,
        image: undefined,
        symbol: 'bazB',
        aggregators: [],
        isERC721: undefined,
        name: undefined,
      });
    });
  });

  it('should add token by selected address', async () => {
    const firstAddress = '0x123';
    const firstAccount = createMockInternalAccount({
      address: firstAddress,
    });
    const secondAddress = '0x321';
    const secondAccount = createMockInternalAccount({
      address: secondAddress,
    });
    await withController(
      {
        mocks: {
          getAccount: firstAccount,
          getSelectedAccount: firstAccount,
        },
      },
      async ({ controller, triggerSelectedAccountChange }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );

        triggerSelectedAccountChange(firstAccount);
        await controller.addToken({
          address: '0x01',
          symbol: 'bar',
          decimals: 2,
          networkClientId: 'mainnet',
        });
        triggerSelectedAccountChange(secondAccount);

        expect(
          controller.state.allTokens[ChainId.mainnet][firstAccount.address][0],
        ).toStrictEqual({
          address: '0x01',
          decimals: 2,
          image: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x01.png',
          symbol: 'bar',
          isERC721: false,
          aggregators: [],
          name: undefined,
        });

        expect(
          controller.state.allTokens[ChainId.mainnet][secondAccount.address],
        ).toBeUndefined();
      },
    );
  });

  it('should add token by network', async () => {
    await withController(async ({ controller, changeNetwork }) => {
      changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });
      await controller.addToken({
        address: '0x01',
        symbol: 'bar',
        decimals: 2,
        networkClientId: 'sepolia',
      });

      changeNetwork({ selectedNetworkClientId: InfuraNetworkType.goerli });
      expect(controller.state.allTokens[ChainId.goerli]).toBeUndefined();

      changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });
      expect(
        controller.state.allTokens[ChainId.sepolia][
          defaultMockInternalAccount.address
        ][0],
      ).toStrictEqual({
        address: '0x01',
        decimals: 2,
        image:
          'https://static.cx.metamask.io/api/v1/tokenIcons/11155111/0x01.png',
        symbol: 'bar',
        isERC721: false,
        aggregators: [],
        name: undefined,
      });
    });
  });

  it('should add token to the correct chainId when passed a networkClientId', async () => {
    await withController(
      {
        mockNetworkClientConfigurationsByNetworkClientId: {
          networkClientId1: buildCustomNetworkClientConfiguration({
            chainId: '0x5',
          }),
        },
      },
      async ({ controller }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );

        await controller.addToken({
          address: '0x01',
          symbol: 'bar',
          decimals: 2,
          networkClientId: 'networkClientId1',
        });

        expect(
          controller.state.allTokens[ChainId.goerli][
            defaultMockInternalAccount.address
          ][0],
        ).toStrictEqual({
          address: '0x01',
          decimals: 2,
          image: 'https://static.cx.metamask.io/api/v1/tokenIcons/5/0x01.png',
          symbol: 'bar',
          isERC721: false,
          aggregators: [],
          name: undefined,
        });
        expect(controller.state.allTokens['0x5']['0x1']).toStrictEqual([
          {
            address: '0x01',
            decimals: 2,
            image: 'https://static.cx.metamask.io/api/v1/tokenIcons/5/0x01.png',
            symbol: 'bar',
            isERC721: false,
            aggregators: [],
            name: undefined,
          },
        ]);
      },
    );
  });

  it('should remove token', async () => {
    await withController(async ({ controller }) => {
      await controller.addToken({
        address: '0x01',
        symbol: 'bar',
        decimals: 2,
        networkClientId: 'mainnet',
      });

      controller.ignoreTokens(['0x01'], 'mainnet');

      expect(
        controller.state.allTokens[ChainId.mainnet][
          defaultMockInternalAccount.address
        ],
      ).toHaveLength(0);
    });
  });

  it('should remove detected token', async () => {
    await withController(async ({ controller }) => {
      await controller.addDetectedTokens(
        [
          {
            address: '0x01',
            symbol: 'bar',
            decimals: 2,
          },
        ],
        {
          chainId: ChainId.mainnet,
        },
      );

      controller.ignoreTokens(['0x01'], 'mainnet');

      expect(
        controller.state.allDetectedTokens[ChainId.mainnet][
          defaultMockInternalAccount.address
        ],
      ).toHaveLength(0);
    });
  });

  it('should remove token by selected address', async () => {
    const firstAddress = '0x123';
    const firstAccount = createMockInternalAccount({
      address: firstAddress,
    });
    const secondAddress = '0x321';
    const secondAccount = createMockInternalAccount({
      address: secondAddress,
    });
    await withController(
      {
        mocks: {
          getAccount: firstAccount,
          getSelectedAccount: firstAccount,
        },
      },
      async ({ controller, triggerSelectedAccountChange }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );

        triggerSelectedAccountChange(firstAccount);
        await controller.addToken({
          address: '0x02',
          symbol: 'baz',
          decimals: 2,
          networkClientId: 'mainnet',
        });
        triggerSelectedAccountChange(secondAccount);
        await controller.addToken({
          address: '0x01',
          symbol: 'bar',
          decimals: 2,
          networkClientId: 'mainnet',
        });

        controller.ignoreTokens(['0x01'], 'mainnet');
        expect(
          controller.state.allTokens[ChainId.mainnet][secondAccount.address],
        ).toHaveLength(0);

        triggerSelectedAccountChange(firstAccount);
        expect(
          controller.state.allTokens[ChainId.mainnet][firstAccount.address][0],
        ).toStrictEqual({
          address: '0x02',
          decimals: 2,
          image: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x02.png',
          symbol: 'baz',
          isERC721: false,
          aggregators: [],
          name: undefined,
        });
      },
    );
  });

  it('should remove token by provider type', async () => {
    await withController(async ({ controller, changeNetwork }) => {
      ContractMock.mockReturnValue(
        buildMockEthersERC721Contract({ supportsInterface: false }),
      );
      changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });
      await controller.addToken({
        address: '0x02',
        symbol: 'baz',
        decimals: 2,
        networkClientId: 'sepolia',
      });
      changeNetwork({ selectedNetworkClientId: InfuraNetworkType.goerli });
      await controller.addToken({
        address: '0x01',
        symbol: 'bar',
        decimals: 2,
        networkClientId: 'goerli',
      });

      controller.ignoreTokens(['0x01'], 'goerli');
      expect(
        controller.state.allTokens[ChainId.goerli][
          defaultMockInternalAccount.address
        ],
      ).toHaveLength(0);

      changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });
      expect(
        controller.state.allTokens[ChainId.sepolia][
          defaultMockInternalAccount.address
        ][0],
      ).toStrictEqual({
        address: '0x02',
        decimals: 2,
        image:
          'https://static.cx.metamask.io/api/v1/tokenIcons/11155111/0x02.png',
        symbol: 'baz',
        isERC721: false,
        aggregators: [],
        name: undefined,
      });
    });
  });

  describe('ignoredTokens', () => {
    it('should remove token from ignoredTokens/allIgnoredTokens lists if added back via addToken', async () => {
      await withController(async ({ controller }) => {
        await controller.addToken({
          address: '0x01',
          symbol: 'foo',
          decimals: 2,
          networkClientId: 'mainnet',
        });
        await controller.addToken({
          address: '0xFAa',
          symbol: 'bar',
          decimals: 3,
          networkClientId: 'mainnet',
        });

        expect(
          controller.state.allIgnoredTokens[ChainId.mainnet],
        ).toBeUndefined();
        expect(
          controller.state.allTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toHaveLength(2);

        controller.ignoreTokens(['0x01'], 'mainnet');
        expect(
          controller.state.allIgnoredTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toHaveLength(1);
        expect(
          controller.state.allTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toHaveLength(1);

        await controller.addToken({
          address: '0x01',
          symbol: 'baz',
          decimals: 2,
          networkClientId: 'mainnet',
        });
        expect(
          controller.state.allTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toHaveLength(2);
        expect(
          controller.state.allIgnoredTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toHaveLength(0);
      });
    });

    it('should remove a token from the ignoredTokens/allIgnoredTokens lists if re-added as part of a bulk addTokens add', async () => {
      const selectedAddress = '0x0001';
      const selectedAccount = createMockInternalAccount({
        address: selectedAddress,
      });
      await withController(
        {
          mocks: {
            getSelectedAccount: selectedAccount,
            getAccount: selectedAccount,
          },
        },
        async ({ controller, triggerSelectedAccountChange, changeNetwork }) => {
          triggerSelectedAccountChange(selectedAccount);
          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });
          await controller.addToken({
            address: '0x01',
            symbol: 'bar',
            decimals: 2,
            networkClientId: 'sepolia',
          });
          await controller.addToken({
            address: '0xFAa',
            symbol: 'bar',
            decimals: 3,
            networkClientId: 'sepolia',
          });

          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia],
          ).toBeUndefined();
          expect(
            controller.state.allTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(2);

          controller.ignoreTokens(['0x01'], 'sepolia');
          controller.ignoreTokens(['0xFAa'], 'sepolia');

          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(2);
          expect(
            controller.state.allTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(0);

          await controller.addTokens(
            [
              { address: '0x01', decimals: 3, symbol: 'bar', aggregators: [] },
              { address: '0x02', decimals: 4, symbol: 'baz', aggregators: [] },
              { address: '0x04', decimals: 4, symbol: 'foo', aggregators: [] },
            ],
            'sepolia',
          );
          expect(
            controller.state.allTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(3);
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(1);
          expect(controller.state.allIgnoredTokens).toStrictEqual({
            [ChainId.sepolia]: {
              [selectedAddress]: ['0xFAa'],
            },
          });
        },
      );
    });

    it('should be able to clear the ignoredTokens list', async () => {
      const selectedAddress = '0x0001';
      const selectedAccount = createMockInternalAccount({
        address: selectedAddress,
      });
      await withController(
        {
          mocks: {
            getSelectedAccount: selectedAccount,
            getAccount: selectedAccount,
          },
        },
        async ({ controller, triggerSelectedAccountChange, changeNetwork }) => {
          triggerSelectedAccountChange(selectedAccount);
          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });
          await controller.addToken({
            address: '0x01',
            symbol: 'bar',
            decimals: 2,
            networkClientId: 'sepolia',
          });
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia],
          ).toBeUndefined();

          controller.ignoreTokens(['0x01'], 'sepolia');
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(1);
          expect(controller.state.allIgnoredTokens).toStrictEqual({
            [ChainId.sepolia]: {
              [selectedAddress]: ['0x01'],
            },
          });

          controller.clearIgnoredTokens();
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia],
          ).toBeUndefined();
          expect(Object.keys(controller.state.allIgnoredTokens)).toHaveLength(
            0,
          );
        },
      );
    });

    it('should ignore tokens by [chainID][accountAddress]', async () => {
      const selectedAddress1 = '0x0001';
      const selectedAccount1 = createMockInternalAccount({
        address: selectedAddress1,
      });
      const selectedAddress2 = '0x0002';
      const selectedAccount2 = createMockInternalAccount({
        address: selectedAddress2,
      });
      await withController(
        {
          mocks: {
            getSelectedAccount: selectedAccount1,
            getAccount: selectedAccount1,
          },
        },
        async ({ controller, triggerSelectedAccountChange, changeNetwork }) => {
          triggerSelectedAccountChange(selectedAccount1);
          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });
          await controller.addToken({
            address: '0x01',
            symbol: 'bar',
            decimals: 2,
            networkClientId: 'sepolia',
          });
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia],
          ).toBeUndefined();

          controller.ignoreTokens(['0x01'], 'sepolia');
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia][
              selectedAccount1.address
            ],
          ).toStrictEqual(['0x01']);

          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.goerli });
          expect(
            controller.state.allIgnoredTokens[ChainId.goerli],
          ).toBeUndefined();

          await controller.addToken({
            address: '0x02',
            symbol: 'bazz',
            decimals: 3,
            networkClientId: 'goerli',
          });
          controller.ignoreTokens(['0x02'], 'goerli');
          expect(
            controller.state.allIgnoredTokens[ChainId.goerli][
              selectedAccount1.address
            ],
          ).toStrictEqual(['0x02']);

          triggerSelectedAccountChange(selectedAccount2);
          expect(
            controller.state.allIgnoredTokens[ChainId.goerli][
              selectedAccount2.address
            ],
          ).toBeUndefined();

          await controller.addToken({
            address: '0x03',
            symbol: 'foo',
            decimals: 4,
            networkClientId: 'goerli',
          });
          controller.ignoreTokens(['0x03'], 'goerli');
          expect(
            controller.state.allIgnoredTokens[ChainId.goerli][
              selectedAccount2.address
            ],
          ).toStrictEqual(['0x03']);
          expect(controller.state.allIgnoredTokens).toStrictEqual({
            [ChainId.sepolia]: {
              [selectedAddress1]: ['0x01'],
            },
            [ChainId.goerli]: {
              [selectedAddress1]: ['0x02'],
              [selectedAddress2]: ['0x03'],
            },
          });
        },
      );
    });

    it('should ignore tokens by networkClientId', async () => {
      const selectedAddress = '0x0001';
      const otherAddress = '0x0002';
      const selectedAccount = createMockInternalAccount({
        address: selectedAddress,
      });
      const otherAccount = createMockInternalAccount({
        address: otherAddress,
      });

      await withController(
        {
          mocks: {
            getSelectedAccount: selectedAccount,
            getAccount: selectedAccount,
          },
        },
        async ({ controller, triggerSelectedAccountChange, changeNetwork }) => {
          // Select the first account
          triggerSelectedAccountChange(selectedAccount);

          // Add and ignore a token on Sepolia
          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });
          await controller.addToken({
            address: '0x01',
            symbol: 'Token1',
            decimals: 18,
            networkClientId: 'sepolia',
          });
          expect(
            controller.state.allTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(1);
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia],
          ).toBeUndefined();

          controller.ignoreTokens(['0x01'], InfuraNetworkType.sepolia);
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toStrictEqual(['0x01']);

          // Verify that Goerli network has no ignored tokens
          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.goerli });
          expect(
            controller.state.allIgnoredTokens[ChainId.goerli],
          ).toBeUndefined();

          // Add and ignore a token on Goerli
          await controller.addToken({
            address: '0x02',
            symbol: 'Token2',
            decimals: 8,
            networkClientId: 'goerli',
          });
          controller.ignoreTokens(['0x02'], InfuraNetworkType.goerli);
          expect(
            controller.state.allTokens[ChainId.goerli][selectedAccount.address],
          ).toHaveLength(0);
          expect(
            controller.state.allIgnoredTokens[ChainId.goerli][
              selectedAccount.address
            ],
          ).toStrictEqual(['0x02']);

          // Verify that switching back to Sepolia retains its ignored tokens
          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toStrictEqual(['0x01']);

          // Switch to a different account on Goerli
          triggerSelectedAccountChange(otherAccount);
          expect(
            controller.state.allIgnoredTokens[ChainId.goerli][
              otherAccount.address
            ],
          ).toBeUndefined();

          // Add and ignore a token on the new account
          await controller.addToken({
            address: '0x03',
            symbol: 'Token3',
            decimals: 6,
            networkClientId: 'goerli',
          });
          controller.ignoreTokens(['0x03'], InfuraNetworkType.goerli);
          expect(
            controller.state.allIgnoredTokens[ChainId.goerli][
              otherAccount.address
            ],
          ).toStrictEqual(['0x03']);

          // Validate the overall ignored tokens state
          expect(controller.state.allIgnoredTokens).toStrictEqual({
            [ChainId.sepolia]: {
              [selectedAddress]: ['0x01'],
            },
            [ChainId.goerli]: {
              [selectedAddress]: ['0x02'],
              [otherAddress]: ['0x03'],
            },
          });
        },
      );
    });

    it('should not update detectedTokens, tokens, and ignoredTokens state given a network that is different from the globally selected network', async () => {
      const selectedAddress = '0x0001';
      const selectedAccount = createMockInternalAccount({
        address: selectedAddress,
      });

      await withController(
        {
          mocks: {
            getSelectedAccount: selectedAccount,
            getAccount: selectedAccount,
          },
        },
        async ({ controller, triggerSelectedAccountChange, changeNetwork }) => {
          // Select the first account
          triggerSelectedAccountChange(selectedAccount);

          // Add tokens to sepolia
          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });
          await controller.addToken({
            address: '0x01',
            symbol: 'Token1',
            decimals: 18,
            networkClientId: 'sepolia',
          });
          expect(
            controller.state.allTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(1);
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia],
          ).toBeUndefined();

          // switch to goerli
          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.goerli });

          // Add tokens to goerli
          await controller.addToken({
            address: '0x02',
            symbol: 'Token2',
            decimals: 8,
            networkClientId: 'goerli',
          });

          expect(
            controller.state.allTokens[ChainId.goerli][selectedAccount.address],
          ).toHaveLength(1);
          expect(
            controller.state.allIgnoredTokens[ChainId.goerli],
          ).toBeUndefined();

          // ignore token on sepolia
          controller.ignoreTokens(['0x01'], InfuraNetworkType.goerli);

          // as we are not on sepolia, tokens, ignoredTokens, and detectedTokens should not be affected
          expect(
            controller.state.allTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(1);
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia],
          ).toBeUndefined();
          expect(Object.keys(controller.state.allDetectedTokens)).toHaveLength(
            0,
          );
        },
      );
    });

    it('should update tokens, and ignoredTokens and detectedTokens state for the globally selected network', async () => {
      const selectedAddress = '0x0001';
      const selectedAccount = createMockInternalAccount({
        address: selectedAddress,
      });

      await withController(
        {
          mocks: {
            getSelectedAccount: selectedAccount,
            getAccount: selectedAccount,
          },
        },
        async ({ controller, triggerSelectedAccountChange, changeNetwork }) => {
          // Select the first account
          triggerSelectedAccountChange(selectedAccount);

          // Set globally selected network to sepolia
          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });

          // Add a token to sepolia
          await controller.addToken({
            address: '0x01',
            symbol: 'Token1',
            decimals: 18,
            networkClientId: 'sepolia',
          });
          // Add a detected token to sepolia
          await controller.addDetectedTokens(
            [{ address: '0x03', symbol: 'Token3', decimals: 18 }],
            {
              selectedAddress: '0x0001',
              chainId: '0x1',
            },
          );

          expect(
            controller.state.allTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(1);
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia],
          ).toBeUndefined();

          // Ignore the token on sepolia
          controller.ignoreTokens(['0x01'], InfuraNetworkType.sepolia);

          // Ensure the tokens and ignoredTokens are updated for sepolia (globally selected network)
          expect(
            controller.state.allTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(0);
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(1);
          expect(Object.keys(controller.state.allDetectedTokens)).toHaveLength(
            1,
          );
        },
      );
    });

    it('should not retain ignored tokens from a different network', async () => {
      const selectedAddress = '0x0001';
      const selectedAccount = createMockInternalAccount({
        address: selectedAddress,
      });

      await withController(
        {
          mocks: {
            getSelectedAccount: selectedAccount,
            getAccount: selectedAccount,
          },
        },
        async ({ controller, triggerSelectedAccountChange, changeNetwork }) => {
          // Select the first account
          triggerSelectedAccountChange(selectedAccount);

          // Add and ignore a token on Sepolia
          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });
          await controller.addToken({
            address: '0x01',
            symbol: 'Token1',
            decimals: 18,
            networkClientId: 'sepolia',
          });
          expect(
            controller.state.allTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(1);
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia],
          ).toBeUndefined();

          // Switch to Goerli network
          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.goerli });
          expect(
            controller.state.allIgnoredTokens[ChainId.goerli],
          ).toBeUndefined();

          // Ignore the token on Sepolia
          controller.ignoreTokens(['0x01'], InfuraNetworkType.sepolia);
          expect(
            controller.state.allTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(0);
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toStrictEqual(['0x01']);

          // Attempt to ignore a token that was added on Goerli
          await controller.addToken({
            address: '0x02',
            symbol: 'Token2',
            decimals: 8,
            networkClientId: 'goerli',
          });
          controller.ignoreTokens(['0x02'], InfuraNetworkType.goerli);
          expect(
            controller.state.allTokens[ChainId.goerli][selectedAccount.address],
          ).toHaveLength(0);
          expect(
            controller.state.allIgnoredTokens[ChainId.goerli][
              selectedAccount.address
            ],
          ).toStrictEqual(['0x02']);

          // Verify that the ignored tokens from Sepolia are not retained
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toHaveLength(1);
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toStrictEqual(['0x01']);
          expect(controller.state.allIgnoredTokens).toStrictEqual({
            [ChainId.sepolia]: {
              [selectedAddress]: ['0x01'],
            },
            [ChainId.goerli]: {
              [selectedAddress]: ['0x02'],
            },
          });

          // Switch back to Sepolia and check ignored tokens
          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia][
              selectedAccount.address
            ],
          ).toStrictEqual(['0x01']);
        },
      );
    });
  });

  it('should ignore multiple tokens with single ignoreTokens call', async () => {
    await withController(async ({ controller }) => {
      ContractMock.mockReturnValue(
        buildMockEthersERC721Contract({ supportsInterface: false }),
      );

      await controller.addToken({
        address: '0x01',
        symbol: 'A',
        decimals: 4,
        networkClientId: 'mainnet',
      });
      await controller.addToken({
        address: '0x02',
        symbol: 'B',
        decimals: 5,
        networkClientId: 'mainnet',
      });
      expect(
        controller.state.allTokens[ChainId.mainnet][
          defaultMockInternalAccount.address
        ],
      ).toStrictEqual([
        {
          address: '0x01',
          decimals: 4,
          image: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x01.png',
          isERC721: false,
          symbol: 'A',
          aggregators: [],
          name: undefined,
        },
        {
          address: '0x02',
          decimals: 5,
          image: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x02.png',
          isERC721: false,
          symbol: 'B',
          aggregators: [],
          name: undefined,
        },
      ]);

      controller.ignoreTokens(['0x01', '0x02'], 'mainnet');

      expect(
        controller.state.allTokens[ChainId.mainnet][
          defaultMockInternalAccount.address
        ],
      ).toStrictEqual([]);
    });
  });

  describe('isERC721 flag', () => {
    describe('updateTokenType method', () => {
      it('should add isERC721 = true to token object already in state when token is NFT and in our contract-metadata repo', async () => {
        await withController(async ({ controller }) => {
          const contractAddresses = Object.keys(contractMaps);
          const erc721ContractAddresses = contractAddresses.filter(
            (contractAddress) => contractMaps[contractAddress].erc721 === true,
          );
          const address = erc721ContractAddresses[0];
          const { symbol, decimals } = contractMaps[address];

          await controller.addToken({
            address,
            symbol,
            decimals,
            networkClientId: 'mainnet',
          });

          const result = await controller.updateTokenType(address, 'mainnet');
          expect(result.isERC721).toBe(true);
        });
      });

      it('should add isERC721 = false to token object already in state when token is not an NFT and is in our contract-metadata repo', async () => {
        await withController(async ({ controller }) => {
          const contractAddresses = Object.keys(contractMaps);
          const erc20ContractAddresses = contractAddresses.filter(
            (contractAddress) => contractMaps[contractAddress].erc20 === true,
          );
          const address = erc20ContractAddresses[0];
          const { symbol, decimals } = contractMaps[address];

          await controller.addToken({
            address,
            symbol,
            decimals,
            networkClientId: 'mainnet',
          });

          const result = await controller.updateTokenType(address, 'mainnet');
          expect(result.isERC721).toBe(false);
        });
      });

      it('should add isERC721 = true to token object already in state when token is NFT and is not in our contract-metadata repo', async () => {
        await withController(async ({ controller }) => {
          ContractMock.mockReturnValue(
            buildMockEthersERC721Contract({ supportsInterface: true }),
          );
          const tokenAddress = '0xda5584cc586d07c7141aa427224a4bd58e64af7d';

          await controller.addToken({
            address: tokenAddress,
            symbol: 'TESTNFT',
            decimals: 0,
            networkClientId: 'mainnet',
          });

          const result = await controller.updateTokenType(
            tokenAddress,
            'mainnet',
          );
          expect(result.isERC721).toBe(true);
        });
      });

      it('should add isERC721 = false to token object already in state when token is not an NFT and not in our contract-metadata repo', async () => {
        await withController(async ({ controller }) => {
          ContractMock.mockReturnValue(
            buildMockEthersERC721Contract({ supportsInterface: false }),
          );
          const tokenAddress = '0xda5584cc586d07c7141aa427224a4bd58e64af7d';

          await controller.addToken({
            address: tokenAddress,
            symbol: 'TESTNFT',
            decimals: 0,
            networkClientId: 'mainnet',
          });

          const result = await controller.updateTokenType(
            tokenAddress,
            'mainnet',
          );
          expect(result.isERC721).toBe(false);
        });
      });
    });

    describe('addToken method', () => {
      it('should add isERC721 = true when token is an NFT and is in our contract-metadata repo', async () => {
        await withController(async ({ controller }) => {
          const contractAddresses = Object.keys(contractMaps);
          const erc721ContractAddresses = contractAddresses.filter(
            (contractAddress) => contractMaps[contractAddress].erc721 === true,
          );
          const address = erc721ContractAddresses[0];
          const { symbol, decimals } = contractMaps[address];

          await controller.addToken({
            address,
            symbol,
            decimals,
            networkClientId: 'mainnet',
          });

          expect(
            controller.state.allTokens[ChainId.mainnet][
              defaultMockInternalAccount.address
            ],
          ).toStrictEqual([
            expect.objectContaining({
              address,
              symbol,
              isERC721: true,
              decimals,
            }),
          ]);
        });
      });

      it('should add isERC721 = true when the token is an NFT but not in our contract-metadata repo', async () => {
        await withController(async ({ controller }) => {
          ContractMock.mockReturnValue(
            buildMockEthersERC721Contract({ supportsInterface: true }),
          );
          const tokenAddress = '0xDA5584Cc586d07c7141aA427224A4Bd58E64aF7D';

          await controller.addToken({
            address: tokenAddress,
            symbol: 'REST',
            decimals: 4,
            networkClientId: 'mainnet',
          });

          expect(
            controller.state.allTokens[ChainId.mainnet][
              defaultMockInternalAccount.address
            ],
          ).toStrictEqual([
            {
              address: tokenAddress,
              symbol: 'REST',
              isERC721: true,
              image:
                'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xda5584cc586d07c7141aa427224a4bd58e64af7d.png',
              decimals: 4,
              aggregators: [],
              name: undefined,
            },
          ]);
        });
      });

      it('should add isERC721 = false to token object already in state when token is not an NFT and in our contract-metadata repo', async () => {
        await withController(async ({ controller }) => {
          const contractAddresses = Object.keys(contractMaps);
          const erc20ContractAddresses = contractAddresses.filter(
            (contractAddress) => contractMaps[contractAddress].erc20 === true,
          );
          const address = erc20ContractAddresses[0];
          const { symbol, decimals } = contractMaps[address];

          await controller.addToken({
            address,
            symbol,
            decimals,
            networkClientId: 'mainnet',
          });

          expect(
            controller.state.allTokens[ChainId.mainnet][
              defaultMockInternalAccount.address
            ],
          ).toStrictEqual([
            expect.objectContaining({
              address,
              symbol,
              isERC721: false,
              decimals,
            }),
          ]);
        });
      });

      it('should add isERC721 = false when the token is not an NFT and not in our contract-metadata repo', async () => {
        await withController(async ({ controller }) => {
          ContractMock.mockReturnValue(
            buildMockEthersERC721Contract({ supportsInterface: false }),
          );
          const tokenAddress = '0xDA5584Cc586d07c7141aA427224A4Bd58E64aF7D';

          await controller.addToken({
            address: tokenAddress,
            symbol: 'LEST',
            decimals: 5,
            networkClientId: 'mainnet',
          });

          expect(
            controller.state.allTokens[ChainId.mainnet][
              defaultMockInternalAccount.address
            ],
          ).toStrictEqual([
            {
              address: tokenAddress,
              symbol: 'LEST',
              isERC721: false,
              image:
                'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xda5584cc586d07c7141aa427224a4bd58e64af7d.png',
              decimals: 5,
              aggregators: [],
              name: undefined,
            },
          ]);
        });
      });
    });

    it('should throw TokenService error if fetchTokenMetadata returns a response with an error', async () => {
      const chainId = ChainId.mainnet;

      await withController(
        {
          options: {
            chainId,
          },
        },
        async ({ controller }) => {
          const dummyTokenAddress =
            '0x514910771AF9Ca656af840dff83E8264EcF986CA';
          const error = 'An error occured';
          const fullErrorMessage = `TokenService Error: ${error}`;
          nock(TOKEN_END_POINT_API)
            .get(
              // TODO: Either fix this lint violation or explain why it's necessary to ignore.
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              `/token/${convertHexToDecimal(
                chainId,
              )}?address=${dummyTokenAddress}`,
            )
            .reply(200, { error })
            .persist();

          await expect(
            controller.addToken({
              address: dummyTokenAddress,
              symbol: 'LINK',
              decimals: 18,
              networkClientId: 'mainnet',
            }),
          ).rejects.toThrow(fullErrorMessage);
        },
      );
    });

    it('should add token that was previously a detected token', async () => {
      await withController(async ({ controller }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );
        const dummyDetectedToken: Token = {
          address: '0x01',
          symbol: 'barA',
          decimals: 2,
          aggregators: [],
          image: undefined,
          isERC721: false,
          name: undefined,
        };
        const dummyAddedToken: Token = {
          ...dummyDetectedToken,
          image: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x01.png',
        };

        await controller.addDetectedTokens([dummyDetectedToken], {
          selectedAddress: defaultMockInternalAccount.address,
          chainId: ChainId.mainnet,
        });
        expect(
          controller.state.allDetectedTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toStrictEqual([dummyDetectedToken]);

        await controller.addToken({
          address: dummyDetectedToken.address,
          symbol: dummyDetectedToken.symbol,
          decimals: dummyDetectedToken.decimals,
          networkClientId: 'mainnet',
        });
        expect(
          controller.state.allDetectedTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toStrictEqual([]);
        expect(
          controller.state.allTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toStrictEqual([dummyAddedToken]);
      });
    });

    it('should add tokens to the correct chainId/selectedAddress on which they were detected even if its not the currently configured chainId/selectedAddress', async () => {
      const CONFIGURED_ADDRESS = '0xConfiguredAddress';
      const configuredAccount = createMockInternalAccount({
        address: CONFIGURED_ADDRESS,
      });
      await withController(
        {
          mocks: {
            getAccount: configuredAccount,
          },
        },
        async ({ controller, changeNetwork, triggerSelectedAccountChange }) => {
          ContractMock.mockReturnValue(
            buildMockEthersERC721Contract({ supportsInterface: false }),
          );

          // The currently configured chain + address
          const CONFIGURED_CHAIN = ChainId.sepolia;
          const CONFIGURED_NETWORK_CLIENT_ID = InfuraNetworkType.sepolia;

          changeNetwork({
            selectedNetworkClientId: CONFIGURED_NETWORK_CLIENT_ID,
          });
          triggerSelectedAccountChange(configuredAccount);

          // A different chain + address
          const OTHER_CHAIN = '0xOtherChainId';
          const OTHER_ADDRESS = '0xOtherAddress';

          // Mock some tokens to add
          const generateTokens = (len: number) =>
            [...Array(len)].map((_, i) => ({
              address: `0x${i}`,
              symbol: String.fromCharCode(65 + i),
              decimals: 2,
              aggregators: [],
              name: undefined,
              isERC721: false,
              image: `https://static.cx.metamask.io/api/v1/tokenIcons/11155111/0x${i}.png`,
            }));

          const [
            addedTokenConfiguredAccount,
            detectedTokenConfiguredAccount,
            detectedTokenOtherAccount,
          ] = generateTokens(3);

          // Run twice to ensure idempotency
          for (let i = 0; i < 2; i++) {
            // Add and detect some tokens on the configured chain + account
            await controller.addToken({
              ...addedTokenConfiguredAccount,
              networkClientId: CONFIGURED_NETWORK_CLIENT_ID,
            });
            await controller.addDetectedTokens(
              [detectedTokenConfiguredAccount],
              {
                selectedAddress: CONFIGURED_ADDRESS,
                chainId: CONFIGURED_CHAIN,
              },
            );

            // Detect a token on the other chain + account
            await controller.addDetectedTokens([detectedTokenOtherAccount], {
              selectedAddress: OTHER_ADDRESS,
              chainId: OTHER_CHAIN,
            });

            // Expect tokens on the configured account
            expect(
              controller.state.allTokens[CONFIGURED_CHAIN][CONFIGURED_ADDRESS],
            ).toStrictEqual([addedTokenConfiguredAccount]);
            expect(
              controller.state.allDetectedTokens[CONFIGURED_CHAIN][
                CONFIGURED_ADDRESS
              ],
            ).toStrictEqual([detectedTokenConfiguredAccount]);

            // Expect tokens under the correct chain + account
            expect(controller.state.allTokens).toStrictEqual({
              [CONFIGURED_CHAIN]: {
                [CONFIGURED_ADDRESS]: [addedTokenConfiguredAccount],
              },
            });
            expect(controller.state.allDetectedTokens).toStrictEqual({
              [CONFIGURED_CHAIN]: {
                [CONFIGURED_ADDRESS]: [detectedTokenConfiguredAccount],
              },
              [OTHER_CHAIN]: {
                [OTHER_ADDRESS]: [detectedTokenOtherAccount],
              },
            });
          }
        },
      );
    });
  });

  describe('addTokens method', () => {
    it('should add tokens that were previously detected tokens', async () => {
      await withController(async ({ controller }) => {
        const dummyAddedTokens: Token[] = [
          {
            address: '0x01',
            symbol: 'barA',
            decimals: 2,
            aggregators: [],
            image: undefined,
            name: undefined,
          },
          {
            address: '0x02',
            symbol: 'barB',
            decimals: 2,
            aggregators: [],
            image: undefined,
            name: undefined,
          },
        ];
        const dummyDetectedTokens: Token[] = [
          {
            ...dummyAddedTokens[0],
            isERC721: false,
          },
          {
            ...dummyAddedTokens[1],
            isERC721: false,
          },
        ];

        await controller.addDetectedTokens(dummyDetectedTokens, {
          selectedAddress: defaultMockInternalAccount.address,
          chainId: ChainId.mainnet,
        });
        expect(
          controller.state.allDetectedTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toStrictEqual(dummyDetectedTokens);

        await controller.addTokens(dummyDetectedTokens, 'mainnet');
        expect(
          controller.state.allDetectedTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toStrictEqual([]);
        expect(
          controller.state.allTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toStrictEqual(dummyAddedTokens);
      });
    });

    it('should add tokens to the correct chainId when passed a networkClientId', async () => {
      await withController(
        {
          mockNetworkClientConfigurationsByNetworkClientId: {
            networkClientId1: buildCustomNetworkClientConfiguration({
              chainId: '0x5',
            }),
          },
        },
        async ({ controller, changeNetwork }) => {
          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.goerli });

          const dummyTokens: Token[] = [
            {
              address: '0x01',
              symbol: 'barA',
              decimals: 2,
              aggregators: [],
              image: undefined,
              name: undefined,
            },
            {
              address: '0x02',
              symbol: 'barB',
              decimals: 2,
              aggregators: [],
              image: undefined,
              name: undefined,
            },
          ];

          await controller.addTokens(dummyTokens, 'goerli');

          expect(
            controller.state.allTokens[ChainId.goerli][
              defaultMockInternalAccount.address
            ],
          ).toStrictEqual(dummyTokens);
        },
      );
    });
  });

  describe('watchAsset', () => {
    it('should error if passed no type', async () => {
      await withController(async ({ controller }) => {
        const result = controller.watchAsset({
          asset: buildToken(),
          // @ts-expect-error Intentionally passing invalid input
          type: undefined,
        });

        await expect(result).rejects.toThrow(
          'Asset of type undefined not supported',
        );
      });
    });

    it('should error if asset type is not supported', async () => {
      await withController(async ({ controller }) => {
        const result = controller.watchAsset({
          asset: buildToken(),
          type: 'ERC721',
          networkClientId: 'networkClientId1',
        });

        await expect(result).rejects.toThrow(
          'Asset of type ERC721 not supported',
        );
      });
    });

    it('should error if the contract is ERC721', async () => {
      await withController(async ({ controller }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: true }),
        );

        const result = controller.watchAsset({
          asset: buildToken({
            address: '0x0000000000000000000000000000000000000001',
          }),
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        await expect(result).rejects.toThrow(
          'Contract 0x0000000000000000000000000000000000000001 must match type ERC20, but was detected as ERC721',
        );
      });
    });

    it('should error if the contract is ERC1155', async () => {
      await withController(async ({ controller }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );
        ERC1155StandardMock.mockReturnValue(
          buildMockERC1155Standard({ contractSupportsBase1155Interface: true }),
        );

        const result = controller.watchAsset({
          asset: buildToken({
            address: '0x0000000000000000000000000000000000000001',
          }),
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        await expect(result).rejects.toThrow(
          'Contract 0x0000000000000000000000000000000000000001 must match type ERC20, but was detected as ERC1155',
        );
      });
    });

    it('should error if address is not defined', async () => {
      await withController(async ({ controller }) => {
        const result = controller.watchAsset({
          asset: buildToken({ address: undefined }),
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        await expect(result).rejects.toThrow('Address must be specified');
      });
    });

    it('should error if decimals is not defined', async () => {
      await withController(async ({ controller }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );

        const result = controller.watchAsset({
          asset: buildToken({ decimals: undefined }),
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        await expect(result).rejects.toThrow(
          'Decimals are required, but were not found in either the request or contract',
        );
      });
    });

    it('should error if symbol is not defined', async () => {
      await withController(async ({ controller }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );

        const result = controller.watchAsset({
          // @ts-expect-error Intentionally passing bad input
          asset: buildToken({ symbol: { foo: 'bar' } }),
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        await expect(result).rejects.toThrow('Invalid symbol: not a string');
      });
    });

    it('should error if symbol is not a string', async () => {
      await withController(async ({ controller }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );

        const result = controller.watchAsset({
          asset: buildToken({ symbol: undefined }),
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        await expect(result).rejects.toThrow(
          'A symbol is required, but was not found in either the request or contract',
        );
      });
    });

    it('should error if symbol is empty', async () => {
      await withController(async ({ controller }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );

        const result = controller.watchAsset({
          asset: buildToken({ symbol: '' }),
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        await expect(result).rejects.toThrow(
          'A symbol is required, but was not found in either the request or contract',
        );
      });
    });

    it('should error if symbol is too long', async () => {
      await withController(async ({ controller }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );

        const result = controller.watchAsset({
          asset: buildToken({ symbol: 'ABCDEFGHIJKLM' }),
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        await expect(result).rejects.toThrow(
          'Invalid symbol "ABCDEFGHIJKLM": longer than 11 characters',
        );
      });
    });

    it('should error if decimals is invalid', async () => {
      await withController(async ({ controller }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );

        const result = controller.watchAsset({
          asset: buildToken({ decimals: -1 }),
          type: 'ERC20',
          networkClientId: 'mainnet',
        });
        await expect(result).rejects.toThrow(
          'Invalid decimals "-1": must be an integer 0 <= 36',
        );

        const result2 = controller.watchAsset({
          asset: buildToken({ decimals: 37 }),
          type: 'ERC20',
          networkClientId: 'mainnet',
        });
        await expect(result2).rejects.toThrow(
          'Invalid decimals "37": must be an integer 0 <= 36',
        );
      });
    });

    it('should error if address is invalid', async () => {
      await withController(async ({ controller }) => {
        const result = controller.watchAsset({
          asset: buildToken({ address: '0x123' }),
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        await expect(result).rejects.toThrow('Invalid address "0x123"');
      });
    });

    it('fails with an invalid type suggested', async () => {
      await withController(async ({ controller }) => {
        const result = controller.watchAsset({
          asset: buildToken({
            address: '0xe9f786dfdd9ae4d57e830acb52296837765f0e5b',
            decimals: 18,
            symbol: 'TKN',
          }),
          type: 'ERC721',
          networkClientId: 'mainnet',
        });

        await expect(result).rejects.toThrow(
          'Asset of type ERC721 not supported',
        );
      });
    });

    it("should error if the asset's symbol doesn't match the contract", async () => {
      await withController(async ({ controller }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );
        ERC20StandardMock.mockReturnValue(
          buildMockERC20Standard({
            tokenName: 'Some Token',
            tokenSymbol: 'TOKEN',
            tokenDecimals: '42',
          }),
        );

        const result = controller.watchAsset({
          asset: buildToken({
            name: 'Some Token',
            symbol: 'OTHER',
            decimals: 42,
          }),
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        await expect(result).rejects.toThrow(
          'The symbol in the request (OTHER) does not match the symbol in the contract (TOKEN)',
        );
      });
    });

    it("should error if the asset's decimals don't match the contract", async () => {
      await withController(async ({ controller }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );
        ERC20StandardMock.mockReturnValue(
          buildMockERC20Standard({
            tokenName: 'Some Token',
            tokenSymbol: 'TOKEN',
            tokenDecimals: '42',
          }),
        );

        const result = controller.watchAsset({
          asset: buildToken({
            name: 'Some Token',
            symbol: 'TOKEN',
            decimals: 1,
          }),
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        await expect(result).rejects.toThrow(
          'The decimals in the request (1) do not match the decimals in the contract (42)',
        );
      });
    });

    it('should use symbols/decimals from contract, and allow them to be optional in the request', async () => {
      await withController(async ({ controller, approvalController }) => {
        const asset = buildTokenWithName();
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );
        ERC20StandardMock.mockReturnValue(
          buildMockERC20StandardFromToken(asset),
        );
        jest
          .spyOn(approvalController, 'addAndShowApprovalRequest')
          .mockResolvedValue(undefined);

        await controller.watchAsset({
          // @ts-expect-error Intentionally passing bad input.
          asset: { ...asset, symbol: undefined, decimals: undefined },
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        expect(
          controller.state.allTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toStrictEqual([
          {
            isERC721: false,
            aggregators: [],
            ...asset,
          },
        ]);
      });
    });

    it('should use symbols/decimals from request, and allow them to be optional in the contract', async () => {
      await withController(async ({ controller, approvalController }) => {
        const reqAsset = buildToken({ symbol: 'MYSYMBOL', decimals: 13 });
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );
        jest
          .spyOn(approvalController, 'addAndShowApprovalRequest')
          .mockResolvedValue(undefined);

        await controller.watchAsset({
          asset: reqAsset,
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        expect(
          controller.state.allTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toStrictEqual([
          {
            isERC721: false,
            aggregators: [],
            ...reqAsset,
          },
        ]);
      });
    });

    it("should validate that symbol matches if it's defined in both the request and contract", async () => {
      await withController(async ({ controller }) => {
        const asset = buildTokenWithName({ symbol: 'SES' });
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );
        ERC20StandardMock.mockReturnValue(
          buildMockERC20StandardFromToken(asset),
        );

        const result = controller.watchAsset({
          asset: { ...asset, symbol: 'DIFFERENT' },
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        await expect(result).rejects.toThrow(
          'The symbol in the request (DIFFERENT) does not match the symbol in the contract (SES)',
        );
      });
    });

    it("should validate that decimals match if they're defined in both the request and contract", async () => {
      await withController(async ({ controller }) => {
        const asset = buildTokenWithName({ decimals: 12 });
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );
        ERC20StandardMock.mockReturnValue(
          buildMockERC20StandardFromToken(asset),
        );

        const result = controller.watchAsset({
          asset: { ...asset, decimals: 2 },
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        await expect(result).rejects.toThrow(
          'The decimals in the request (2) do not match the decimals in the contract (12)',
        );
      });
    });

    it('should perform case insensitive validation of symbols', async () => {
      await withController(async ({ controller, approvalController }) => {
        const asset = buildTokenWithName({ symbol: 'ABC' });
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );
        ERC20StandardMock.mockReturnValue(
          buildMockERC20StandardFromToken(asset),
        );
        jest
          .spyOn(approvalController, 'addAndShowApprovalRequest')
          .mockResolvedValue(undefined);

        await controller.watchAsset({
          asset: { ...asset, symbol: 'abc' },
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        expect(
          controller.state.allTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toStrictEqual([
          {
            isERC721: false,
            aggregators: [],
            ...asset,
          },
        ]);
      });
    });

    it('converts decimals from string to integer', async () => {
      await withController(async ({ controller, approvalController }) => {
        // @ts-expect-error Intentionally using a string for decimals
        const asset = buildTokenWithName({ decimals: '6' });
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );
        ERC20StandardMock.mockReturnValue(
          buildMockERC20StandardFromToken(asset),
        );
        jest
          .spyOn(approvalController, 'addAndShowApprovalRequest')
          .mockResolvedValue(undefined);

        await controller.watchAsset({
          asset,
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        expect(
          controller.state.allTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toStrictEqual([
          {
            isERC721: false,
            aggregators: [],
            ...asset,
            decimals: 6,
          },
        ]);
      });
    });

    it('stores token correctly if user confirms', async () => {
      await withController(async ({ controller, approvalController }) => {
        const requestId = '12345';
        const addAndShowApprovalRequestSpy = jest
          .spyOn(approvalController, 'addAndShowApprovalRequest')
          .mockResolvedValue(undefined);
        const asset = buildToken();
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );
        uuidV1Mock.mockReturnValue(requestId);
        await controller.watchAsset({
          asset,
          type: 'ERC20',
          networkClientId: 'mainnet',
        });

        expect(
          controller.state.allTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toHaveLength(1);
        expect(
          controller.state.allTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ],
        ).toStrictEqual([
          {
            isERC721: false,
            aggregators: [],
            ...asset,
          },
        ]);
        expect(addAndShowApprovalRequestSpy).toHaveBeenCalledTimes(1);
        expect(addAndShowApprovalRequestSpy).toHaveBeenCalledWith({
          id: requestId,
          origin: ORIGIN_METAMASK,
          type: ApprovalType.WatchAsset,
          requestData: {
            id: requestId,
            interactingAddress: '0x1',
            asset,
          },
        });
      });
    });

    it('stores token correctly under interacting address if user confirms', async () => {
      const chainId = ChainId.sepolia;

      await withController(
        {
          options: {
            chainId,
          },
        },
        async ({ controller, approvalController }) => {
          const requestId = '12345';
          const addAndShowApprovalRequestSpy = jest
            .spyOn(approvalController, 'addAndShowApprovalRequest')
            .mockResolvedValue(undefined);
          const asset = buildToken();
          const interactingAddress = '0x2';
          ContractMock.mockReturnValue(
            buildMockEthersERC721Contract({ supportsInterface: false }),
          );
          uuidV1Mock.mockReturnValue(requestId);

          await controller.watchAsset({
            asset,
            type: 'ERC20',
            interactingAddress,
            networkClientId: 'sepolia',
          });

          expect(
            controller.state.allTokens[ChainId.sepolia][
              defaultMockInternalAccount.address
            ],
          ).toBeUndefined();
          expect(controller.state.allTokens[ChainId.mainnet]).toBeUndefined();
          expect(
            controller.state.allTokens[chainId][interactingAddress],
          ).toHaveLength(1);
          expect(
            controller.state.allTokens[chainId][interactingAddress],
          ).toStrictEqual([
            {
              isERC721: false,
              aggregators: [],
              ...asset,
            },
          ]);
          expect(addAndShowApprovalRequestSpy).toHaveBeenCalledTimes(1);
          expect(addAndShowApprovalRequestSpy).toHaveBeenCalledWith({
            id: requestId,
            origin: ORIGIN_METAMASK,
            type: ApprovalType.WatchAsset,
            requestData: {
              id: requestId,
              interactingAddress,
              asset,
            },
          });
        },
      );
    });

    it('stores token correctly when passed a networkClientId', async () => {
      const networkClientId = 'networkClientId1';

      await withController(
        {
          mockNetworkClientConfigurationsByNetworkClientId: {
            [networkClientId]: buildCustomNetworkClientConfiguration({
              chainId: '0x5',
            }),
          },
        },
        async ({ controller, approvalController }) => {
          const requestId = '12345';
          const addAndShowApprovalRequestSpy = jest
            .spyOn(approvalController, 'addAndShowApprovalRequest')
            .mockResolvedValue(undefined);
          const asset = buildToken();
          const interactingAddress = '0x2';
          ContractMock.mockReturnValue(
            buildMockEthersERC721Contract({ supportsInterface: false }),
          );
          uuidV1Mock.mockReturnValue(requestId);

          await controller.watchAsset({
            asset,
            type: 'ERC20',
            interactingAddress,
            networkClientId,
          });

          expect(addAndShowApprovalRequestSpy).toHaveBeenCalledWith({
            id: requestId,
            origin: ORIGIN_METAMASK,
            type: ApprovalType.WatchAsset,
            requestData: {
              id: requestId,
              interactingAddress,
              asset,
            },
          });

          expect(controller.state.allTokens[ChainId.sepolia]).toBeUndefined();
          expect(controller.state.allTokens[ChainId.mainnet]).toBeUndefined();
          expect(
            controller.state.allTokens['0x5'][interactingAddress],
          ).toHaveLength(1);
          expect(
            controller.state.allTokens['0x5'][interactingAddress],
          ).toStrictEqual([
            {
              isERC721: false,
              aggregators: [],
              ...asset,
            },
          ]);
        },
      );
    });

    it('throws and does not add token if pending approval fails', async () => {
      await withController(async ({ controller, approvalController }) => {
        const errorMessage = 'Mock Error Message';
        const requestId = '12345';
        const addAndShowApprovalRequestSpy = jest
          .spyOn(approvalController, 'addAndShowApprovalRequest')
          .mockRejectedValue(new Error(errorMessage));
        const asset = buildToken();
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );
        uuidV1Mock.mockReturnValue(requestId);
        await expect(
          controller.watchAsset({
            asset,
            type: 'ERC20',
            networkClientId: 'mainnet',
          }),
        ).rejects.toThrow(errorMessage);

        expect(controller.state.allTokens[ChainId.sepolia]).toBeUndefined();
        expect(controller.state.allTokens[ChainId.mainnet]).toBeUndefined();
        expect(addAndShowApprovalRequestSpy).toHaveBeenCalledTimes(1);
        expect(addAndShowApprovalRequestSpy).toHaveBeenCalledWith({
          id: requestId,
          origin: ORIGIN_METAMASK,
          type: ApprovalType.WatchAsset,
          requestData: {
            id: requestId,
            interactingAddress: '0x1',
            asset,
          },
        });
      });
    });

    it('stores multiple tokens from a batched watchAsset confirmation screen correctly when user confirms', async () => {
      const chainId = ChainId.goerli;

      await withController(
        {
          options: {
            chainId,
          },
        },
        async ({ controller, messenger, approvalController }) => {
          const requestId = '12345';
          const interactingAddress = '0x2';
          const asset = buildTokenWithName({
            address: '0x000000000000000000000000000000000000dEaD',
            decimals: 1,
            image: 'image1',
            name: 'A Token',
            symbol: 'TOKEN1',
          });
          ContractMock.mockReturnValue(
            buildMockEthersERC721Contract({ supportsInterface: false }),
          );
          uuidV1Mock
            .mockReturnValueOnce(requestId)
            .mockReturnValueOnce('67890');

          const acceptedRequest = new Promise<void>((resolve) => {
            messenger.subscribe(
              'TokensController:stateChange',
              (state: TokensControllerState) => {
                if (
                  state.allTokens?.[chainId]?.[interactingAddress].length === 2
                ) {
                  resolve();
                }
              },
            );
          });

          const anotherAsset = buildTokenWithName({
            address: '0x000000000000000000000000000000000000ABcD',
            decimals: 2,
            image: 'image2',
            name: 'Another Token',
            symbol: 'TOKEN2',
          });

          ERC20StandardMock.mockReturnValueOnce(
            buildMockERC20StandardFromToken(asset),
          ).mockReturnValueOnce(buildMockERC20StandardFromToken(anotherAsset));

          const promiseForApprovals = new Promise<void>((resolve) => {
            const listener = (state: ApprovalControllerState) => {
              if (state.pendingApprovalCount === 2) {
                messenger.unsubscribe(
                  'ApprovalController:stateChange',
                  listener,
                );
                resolve();
              }
            };
            messenger.subscribe('ApprovalController:stateChange', listener);
          });

          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          controller.watchAsset({
            asset,
            type: 'ERC20',
            interactingAddress,
            networkClientId: 'goerli',
          });

          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          controller.watchAsset({
            asset: anotherAsset,
            type: 'ERC20',
            interactingAddress,
            networkClientId: 'goerli',
          });

          await promiseForApprovals;

          await approvalController.accept(requestId);
          await approvalController.accept('67890');
          await acceptedRequest;

          expect(
            controller.state.allTokens[chainId][interactingAddress],
          ).toStrictEqual([
            {
              isERC721: false,
              aggregators: [],
              ...asset,
            },
            {
              isERC721: false,
              aggregators: [],
              ...anotherAsset,
            },
          ]);
        },
      );
    });
  });

  describe('when PreferencesController:stateChange is published', () => {
    it('should update tokens list when set address changes', async () => {
      const selectedAccount = createMockInternalAccount({ address: '0x1' });
      const selectedAccount2 = createMockInternalAccount({
        address: '0x2',
      });
      await withController(
        {
          mocks: {
            getAccount: selectedAccount,
            getSelectedAccount: selectedAccount,
          },
        },
        async ({ controller, triggerSelectedAccountChange }) => {
          ContractMock.mockReturnValue(
            buildMockEthersERC721Contract({ supportsInterface: false }),
          );

          triggerSelectedAccountChange(selectedAccount);
          await controller.addToken({
            address: '0x01',
            symbol: 'A',
            decimals: 4,
            networkClientId: 'mainnet',
          });
          await controller.addToken({
            address: '0x02',
            symbol: 'B',
            decimals: 5,
            networkClientId: 'mainnet',
          });
          triggerSelectedAccountChange(selectedAccount2);
          expect(controller.state.allTokens[ChainId.sepolia]).toBeUndefined();

          await controller.addToken({
            address: '0x03',
            symbol: 'C',
            decimals: 6,
            networkClientId: 'mainnet',
          });
          triggerSelectedAccountChange(selectedAccount);
          expect(
            controller.state.allTokens[ChainId.mainnet][
              selectedAccount.address
            ],
          ).toStrictEqual([
            {
              address: '0x01',
              decimals: 4,
              image:
                'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x01.png',
              isERC721: false,
              symbol: 'A',
              aggregators: [],
              name: undefined,
            },
            {
              address: '0x02',
              decimals: 5,
              image:
                'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x02.png',
              isERC721: false,
              symbol: 'B',
              aggregators: [],
              name: undefined,
            },
          ]);

          triggerSelectedAccountChange(selectedAccount2);
          expect(
            controller.state.allTokens[ChainId.mainnet][
              selectedAccount2.address
            ],
          ).toStrictEqual([
            {
              address: '0x03',
              decimals: 6,
              image:
                'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x03.png',
              isERC721: false,
              symbol: 'C',
              aggregators: [],
              name: undefined,
            },
          ]);
        },
      );
    });
  });

  describe('when NetworkController:onNetworkDidChange is published', () => {
    it('should remove a token from its state on corresponding network', async () => {
      await withController(async ({ controller, changeNetwork }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );

        changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });
        await controller.addToken({
          address: '0x01',
          symbol: 'A',
          decimals: 4,
          networkClientId: 'sepolia',
        });
        await controller.addToken({
          address: '0x02',
          symbol: 'B',
          decimals: 5,
          networkClientId: 'sepolia',
        });
        const initialTokensFirst =
          controller.state.allTokens[ChainId.sepolia][
            defaultMockInternalAccount.address
          ];

        changeNetwork({ selectedNetworkClientId: InfuraNetworkType.goerli });
        await controller.addToken({
          address: '0x03',
          symbol: 'C',
          decimals: 4,
          networkClientId: 'goerli',
        });
        await controller.addToken({
          address: '0x04',
          symbol: 'D',
          decimals: 5,
          networkClientId: 'goerli',
        });
        const initialTokensSecond =
          controller.state.allTokens[ChainId.goerli][
            defaultMockInternalAccount.address
          ];

        expect(initialTokensFirst).not.toStrictEqual(initialTokensSecond);
        expect(initialTokensFirst).toStrictEqual([
          {
            address: '0x01',
            decimals: 4,
            image:
              'https://static.cx.metamask.io/api/v1/tokenIcons/11155111/0x01.png',
            isERC721: false,
            symbol: 'A',
            aggregators: [],
            name: undefined,
          },
          {
            address: '0x02',
            decimals: 5,
            image:
              'https://static.cx.metamask.io/api/v1/tokenIcons/11155111/0x02.png',
            isERC721: false,
            symbol: 'B',
            aggregators: [],
            name: undefined,
          },
        ]);
        expect(initialTokensSecond).toStrictEqual([
          {
            address: '0x03',
            decimals: 4,
            image: 'https://static.cx.metamask.io/api/v1/tokenIcons/5/0x03.png',
            isERC721: false,
            symbol: 'C',
            aggregators: [],
            name: undefined,
          },
          {
            address: '0x04',
            decimals: 5,
            image: 'https://static.cx.metamask.io/api/v1/tokenIcons/5/0x04.png',
            isERC721: false,
            symbol: 'D',
            aggregators: [],
            name: undefined,
          },
        ]);

        changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });
        expect(initialTokensFirst).toStrictEqual(
          controller.state.allTokens[ChainId.sepolia][
            defaultMockInternalAccount.address
          ],
        );

        changeNetwork({ selectedNetworkClientId: InfuraNetworkType.goerli });
        expect(initialTokensSecond).toStrictEqual(
          controller.state.allTokens[ChainId.goerli][
            defaultMockInternalAccount.address
          ],
        );
      });
    });
  });

  describe('Clearing nested lists', () => {
    it('should clear nest allTokens under chain ID and selected address when an added token is ignored', async () => {
      const selectedAddress = '0x1';
      const selectedAccount = createMockInternalAccount({
        address: selectedAddress,
      });
      const tokenAddress = '0x01';
      const dummyTokens = [
        {
          address: tokenAddress,
          symbol: 'barA',
          decimals: 2,
          aggregators: [],
          image: undefined,
        },
      ];

      await withController(
        {
          options: {
            chainId: ChainId.mainnet,
          },
          mocks: {
            getSelectedAccount: selectedAccount,
          },
        },
        async ({ controller }) => {
          await controller.addTokens(dummyTokens, 'mainnet');
          controller.ignoreTokens([tokenAddress], 'mainnet');

          expect(
            controller.state.allTokens[ChainId.mainnet][selectedAddress],
          ).toStrictEqual([]);
        },
      );
    });

    it('should clear nest allIgnoredTokens under chain ID and selected address when an ignored token is re-added', async () => {
      const selectedAddress = '0x1';
      const selectedAccount = createMockInternalAccount({
        address: selectedAddress,
      });
      const tokenAddress = '0x01';
      const dummyTokens = [
        {
          address: tokenAddress,
          symbol: 'barA',
          decimals: 2,
          aggregators: [],
          image: undefined,
        },
      ];

      await withController(
        {
          options: {
            chainId: ChainId.mainnet,
          },
          mocks: {
            getSelectedAccount: selectedAccount,
          },
        },
        async ({ controller }) => {
          await controller.addTokens(dummyTokens, 'mainnet');
          controller.ignoreTokens([tokenAddress], 'mainnet');
          await controller.addTokens(dummyTokens, 'mainnet');

          expect(
            controller.state.allIgnoredTokens[ChainId.mainnet][selectedAddress],
          ).toStrictEqual([]);
        },
      );
    });

    it('should clear nest allDetectedTokens under chain ID and selected address when an detected token is added to tokens list', async () => {
      const selectedAddress = '0x1';
      const selectedAccount = createMockInternalAccount({
        address: selectedAddress,
      });
      const tokenAddress = '0x01';
      const dummyTokens = [
        {
          address: tokenAddress,
          symbol: 'barA',
          decimals: 2,
          aggregators: [],
          image: undefined,
        },
      ];

      await withController(
        {
          options: {
            chainId: ChainId.mainnet,
          },
          mocks: {
            getSelectedAccount: selectedAccount,
          },
        },
        async ({ controller }) => {
          await controller.addDetectedTokens(dummyTokens, {
            selectedAddress,
            chainId: ChainId.mainnet,
          });
          await controller.addTokens(dummyTokens, 'mainnet');

          expect(
            controller.state.allDetectedTokens[ChainId.mainnet][
              selectedAddress
            ],
          ).toStrictEqual([]);
        },
      );
    });

    it('should clear allDetectedTokens under chain ID and selected address when a detected token is added to tokens list', async () => {
      const selectedAddress = '0x1';
      const selectedAccount = createMockInternalAccount({
        address: selectedAddress,
      });
      const tokenAddress = '0x01';
      const dummyDetectedTokens = [
        {
          address: tokenAddress,
          symbol: 'barA',
          decimals: 2,
          aggregators: [],
          isERC721: undefined,
          name: undefined,
          image: undefined,
        },
      ];
      const dummyTokens = [
        {
          address: tokenAddress,
          symbol: 'barA',
          decimals: 2,
          aggregators: [],
          isERC721: undefined,
          name: undefined,
          image: undefined,
        },
      ];

      await withController(
        {
          options: {
            chainId: ChainId.mainnet,
          },
          mocks: {
            getSelectedAccount: selectedAccount,
          },
        },
        async ({ controller }) => {
          // First, add detected tokens
          await controller.addDetectedTokens(dummyDetectedTokens, {
            selectedAddress,
            chainId: ChainId.mainnet,
          });
          expect(
            controller.state.allDetectedTokens[ChainId.mainnet][
              selectedAddress
            ],
          ).toStrictEqual(dummyDetectedTokens);

          // Now, add the same token to the tokens list
          await controller.addTokens(dummyTokens, 'mainnet');

          // Check that allDetectedTokens for the selected address is cleared
          expect(
            controller.state.allDetectedTokens[ChainId.mainnet][
              selectedAddress
            ],
          ).toStrictEqual([]);
        },
      );
    });
  });

  describe('when TokenListController:stateChange is published', () => {
    it('updates the name of each token to match its counterpart in the token list', async () => {
      await withController(async ({ controller, messenger }) => {
        ContractMock.mockReturnValue(
          buildMockEthersERC721Contract({ supportsInterface: false }),
        );
        await controller.addToken({
          address: '0x01',
          symbol: 'bar',
          decimals: 2,
          networkClientId: 'mainnet',
        });
        expect(
          controller.state.allTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ][0],
        ).toStrictEqual({
          address: '0x01',
          decimals: 2,
          image: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x01.png',
          symbol: 'bar',
          isERC721: false,
          aggregators: [],
          name: undefined,
        });

        messenger.publish(
          'TokenListController:stateChange',
          // @ts-expect-error Passing a partial TokensState for brevity
          {
            tokensChainsCache: {
              [ChainId.mainnet]: {
                timestamp: 1,
                data: {
                  '0x01': {
                    address: '0x01',
                    symbol: 'bar',
                    decimals: 2,
                    occurrences: 1,
                    name: 'BarName',
                    iconUrl:
                      'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x01.png',
                    aggregators: ['Aave'],
                  },
                },
              },
            },
          },
          [],
        );

        expect(
          controller.state.allTokens[ChainId.mainnet][
            defaultMockInternalAccount.address
          ][0],
        ).toStrictEqual({
          address: '0x01',
          decimals: 2,
          image: 'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x01.png',
          symbol: 'bar',
          isERC721: false,
          aggregators: [],
          name: 'BarName',
        });
      });
    });
  });

  describe('when selectedAccountId is not set or account not found', () => {
    describe('detectTokens', () => {
      it('updates the token states to empty arrays if the selectedAccountId account is undefined', async () => {
        await withController(async ({ controller, changeNetwork }) => {
          ContractMock.mockReturnValue(
            buildMockEthersERC721Contract({ supportsInterface: false }),
          );
          changeNetwork({ selectedNetworkClientId: InfuraNetworkType.sepolia });

          expect(controller.state.allTokens[ChainId.sepolia]).toBeUndefined();
          expect(
            controller.state.allIgnoredTokens[ChainId.sepolia],
          ).toBeUndefined();
          expect(
            controller.state.allDetectedTokens[ChainId.sepolia],
          ).toBeUndefined();
        });
      });
    });

    describe('addToken', () => {
      it('handles undefined selected account', async () => {
        await withController(async ({ controller, getAccountHandler }) => {
          getAccountHandler.mockReturnValue(undefined);
          const contractAddresses = Object.keys(contractMaps);
          const erc721ContractAddresses = contractAddresses.filter(
            (contractAddress) => contractMaps[contractAddress].erc721 === true,
          );
          const address = erc721ContractAddresses[0];
          const { symbol, decimals } = contractMaps[address];

          await controller.addToken({
            address,
            symbol,
            decimals,
            networkClientId: 'mainnet',
          });

          expect(controller.state.allTokens[ChainId.mainnet]['']).toStrictEqual(
            [
              {
                address,
                aggregators: [],
                decimals,
                image:
                  'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03.png',
                isERC721: true,
                name: undefined,
                symbol,
              },
            ],
          );
        });
      });
    });

    describe('addDetectedTokens', () => {
      it('handles an undefined selected account', async () => {
        await withController(async ({ controller, getAccountHandler }) => {
          getAccountHandler.mockReturnValue(undefined);
          const mockToken = {
            address: '0x01',
            symbol: 'barA',
            decimals: 2,
            aggregators: [],
          };
          await controller.addDetectedTokens([mockToken], {
            selectedAddress: defaultMockInternalAccount.address,
            chainId: ChainId.mainnet,
          });
          expect(
            controller.state.allDetectedTokens[ChainId.mainnet]['0x1'][0],
          ).toStrictEqual({
            ...mockToken,
            image: undefined,
            isERC721: undefined,
            name: undefined,
          });
        });
      });
    });

    describe('watchAsset', () => {
      it('handles undefined selected account', async () => {
        await withController(
          async ({ controller, approvalController, getAccountHandler }) => {
            const requestId = '12345';
            const addAndShowApprovalRequestSpy = jest
              .spyOn(approvalController, 'addAndShowApprovalRequest')
              .mockResolvedValue(undefined);
            const asset = buildToken();
            ContractMock.mockReturnValue(
              buildMockEthersERC721Contract({ supportsInterface: false }),
            );
            uuidV1Mock.mockReturnValue(requestId);
            getAccountHandler.mockReturnValue(undefined);
            await controller.watchAsset({
              asset,
              type: 'ERC20',
              networkClientId: 'mainnet',
            });

            expect(
              controller.state.allTokens[ChainId.mainnet][''],
            ).toStrictEqual([
              {
                address: '0x000000000000000000000000000000000000dEaD',
                aggregators: [],
                decimals: 12,
                image: 'image',
                isERC721: false,
                name: undefined,
                symbol: 'TOKEN',
              },
            ]);
            expect(addAndShowApprovalRequestSpy).toHaveBeenCalledTimes(1);
            expect(addAndShowApprovalRequestSpy).toHaveBeenCalledWith({
              id: requestId,
              origin: ORIGIN_METAMASK,
              type: ApprovalType.WatchAsset,
              requestData: {
                id: requestId,
                interactingAddress: '', // this is the default value if account is not found
                asset,
              },
            });
          },
        );
      });
    });
  });

  describe('when NetworkController:stateChange is published', () => {
    it('removes tokens for removed networks', async () => {
      const initialState = {
        allTokens: {
          '0x1': {
            '0x134': [
              {
                address: '0x01',
                symbol: 'TKN1',
                decimals: 18,
                aggregators: [],
                name: 'Token 1',
              },
            ],
          },
          '0x5': {
            // goerli
            '0x456': [
              {
                address: '0x02',
                symbol: 'TKN2',
                decimals: 18,
                aggregators: [],
                name: 'Token 2',
              },
            ],
          },
        },
        tokens: [],
        ignoredTokens: [],
        detectedTokens: [],
        allIgnoredTokens: {},
        allDetectedTokens: {},
      };

      await withController(
        { options: { state: initialState } },
        async ({ controller, triggerNetworkStateChange }) => {
          // Verify initial state
          expect(controller.state).toStrictEqual(initialState);

          // Simulate removing goerli
          triggerNetworkStateChange({} as NetworkState, [
            {
              op: 'remove',
              path: ['networkConfigurationsByChainId', '0x5'],
            },
          ]);

          // Verify tokens were removed on goerli
          expect(controller.state.allTokens).toStrictEqual({
            '0x1': initialState.allTokens['0x1'],
          });
        },
      );
    });
  });

  describe('resetState', () => {
    it('resets the state to default state', async () => {
      const initialState: TokensControllerState = {
        allTokens: {
          [ChainId.mainnet]: {
            '0x0001': [
              {
                address: '0x03',
                symbol: 'barC',
                decimals: 2,
                aggregators: [],
                image: undefined,
                name: undefined,
              },
            ],
          },
        },
        allIgnoredTokens: {
          [ChainId.mainnet]: {
            '0x0001': ['0x03'],
          },
        },
        allDetectedTokens: {
          [ChainId.mainnet]: {
            '0x0001': [
              {
                address: '0x01',
                symbol: 'barA',
                decimals: 2,
                aggregators: [],
                image: undefined,
                name: undefined,
              },
            ],
          },
        },
      };
      await withController(
        {
          options: {
            state: initialState,
          },
        },
        ({ controller }) => {
          expect(controller.state).toStrictEqual(initialState);

          controller.resetState();

          expect(controller.state).toStrictEqual({
            allTokens: {},
            allIgnoredTokens: {},
            allDetectedTokens: {},
          });
        },
      );
    });
  });

  describe('when accountRemoved is published', () => {
    it('removes the list of tokens for the removed account', async () => {
      const firstAddress = '0xA73d9021f67931563fDfe3E8f66261086319a1FC';
      const secondAddress = '0xB73d9021f67931563fDfe3E8f66261086319a1FK';
      const firstAccount = createMockInternalAccount({
        address: firstAddress,
      });
      const secondAccount = createMockInternalAccount({
        address: secondAddress,
      });
      const initialState: TokensControllerState = {
        allTokens: {
          [ChainId.mainnet]: {
            [firstAddress]: [
              {
                address: '0x03',
                symbol: 'barC',
                decimals: 2,
                aggregators: [],
                image: undefined,
                name: undefined,
              },
            ],
            [secondAddress]: [
              {
                address: '0x04',
                symbol: 'barD',
                decimals: 2,
                aggregators: [],
                image: undefined,
                name: undefined,
              },
            ],
          },
        },
        allIgnoredTokens: {},
        allDetectedTokens: {
          [ChainId.mainnet]: {
            [firstAddress]: [],
            [secondAddress]: [],
          },
        },
      };
      await withController(
        {
          options: {
            state: initialState,
          },
          listAccounts: [firstAccount, secondAccount],
        },
        ({ controller, triggerAccountRemoved }) => {
          expect(controller.state).toStrictEqual(initialState);

          triggerAccountRemoved(firstAccount.address);

          expect(controller.state).toStrictEqual({
            allTokens: {
              [ChainId.mainnet]: {
                [secondAddress]: [
                  {
                    address: '0x04',
                    symbol: 'barD',
                    decimals: 2,
                    aggregators: [],
                    image: undefined,
                    name: undefined,
                  },
                ],
              },
            },
            allIgnoredTokens: {},
            allDetectedTokens: {
              [ChainId.mainnet]: {
                [secondAddress]: [],
              },
            },
          });
        },
      );
    });

    it('removes an account with no tokens', async () => {
      const firstAddress = '0xA73d9021f67931563fDfe3E8f66261086319a1FC';
      const secondAddress = '0xB73d9021f67931563fDfe3E8f66261086319a1FK';
      const firstAccount = createMockInternalAccount({
        address: firstAddress,
      });
      const secondAccount = createMockInternalAccount({
        address: secondAddress,
      });
      const initialState: TokensControllerState = {
        allTokens: {
          [ChainId.mainnet]: {
            [firstAddress]: [
              {
                address: '0x03',
                symbol: 'barC',
                decimals: 2,
                aggregators: [],
                image: undefined,
                name: undefined,
              },
            ],
          },
        },
        allIgnoredTokens: {},
        allDetectedTokens: {
          [ChainId.mainnet]: {
            [firstAddress]: [],
          },
        },
      };
      await withController(
        {
          options: {
            state: initialState,
          },
          listAccounts: [firstAccount, secondAccount],
        },
        ({ controller, triggerAccountRemoved }) => {
          expect(controller.state).toStrictEqual(initialState);

          triggerAccountRemoved(secondAccount.address);

          expect(controller.state).toStrictEqual(initialState);
        },
      );
    });
  });
});

type WithControllerCallback<ReturnValue> = ({
  controller,
  changeNetwork,
  messenger,
  approvalController,
  triggerSelectedAccountChange,
  triggerAccountRemoved,
}: {
  controller: TokensController;
  changeNetwork: (networkControllerState: {
    selectedNetworkClientId: NetworkClientId;
  }) => void;
  messenger: UnrestrictedMessenger;
  approvalController: ApprovalController;
  triggerSelectedAccountChange: (internalAccount: InternalAccount) => void;
  triggerAccountRemoved: (accountAddress: string) => void;
  triggerNetworkStateChange: (
    networkState: NetworkState,
    patches: Patch[],
  ) => void;
  getAccountHandler: jest.Mock;
  getSelectedAccountHandler: jest.Mock;
}) => Promise<ReturnValue> | ReturnValue;

type WithControllerMockArgs = {
  getAccount?: InternalAccount;
  getSelectedAccount?: InternalAccount;
};

type WithControllerArgs<ReturnValue> =
  | [WithControllerCallback<ReturnValue>]
  | [
      {
        options?: Partial<ConstructorParameters<typeof TokensController>[0]>;
        mockNetworkClientConfigurationsByNetworkClientId?: Record<
          NetworkClientId,
          NetworkClientConfiguration
        >;
        mocks?: WithControllerMockArgs;
        listAccounts?: InternalAccount[];
      },
      WithControllerCallback<ReturnValue>,
    ];

/**
 * Runs a callback, instantiating a TokensController (and friends) for use in
 * tests, then ensuring that they are properly destroyed after the callback
 * ends.
 *
 * @param args - Arguments to this function.
 * @param args.options - Controller options.
 * @param args.mockNetworkClientConfigurationsByNetworkClientId - Used to construct
 * mock versions of network clients and ultimately mock the
 * `NetworkController:getNetworkClientById` action.
 * @param args.mocks - Move values for actions to be mocked.
 * @returns A collection of test controllers and mocks.
 */
async function withController<ReturnValue>(
  ...args: WithControllerArgs<ReturnValue>
): Promise<ReturnValue> {
  const [
    {
      options = {},
      mockNetworkClientConfigurationsByNetworkClientId = {},
      mocks = {} as WithControllerMockArgs,
      listAccounts = [],
    },
    fn,
  ] = args.length === 2 ? args : [{}, args[0]];

  const messenger = new Messenger<AllowedActions, AllowedEvents>();

  const approvalControllerMessenger = messenger.getRestricted({
    name: 'ApprovalController',
    allowedActions: [],
    allowedEvents: [],
  });
  const approvalController = new ApprovalController({
    messenger: approvalControllerMessenger,
    showApprovalRequest: jest.fn(),
    typesExcludedFromRateLimiting: [ApprovalType.WatchAsset],
  });

  const restrictedMessenger = messenger.getRestricted({
    name: 'TokensController',
    allowedActions: [
      'ApprovalController:addRequest',
      'NetworkController:getNetworkClientById',
      'AccountsController:getAccount',
      'AccountsController:getSelectedAccount',
      'AccountsController:listAccounts',
    ],
    allowedEvents: [
      'NetworkController:networkDidChange',
      'NetworkController:stateChange',
      'AccountsController:selectedEvmAccountChange',
      'TokenListController:stateChange',
      'KeyringController:accountRemoved',
    ],
  });

  const getAccountHandler = jest.fn<InternalAccount, []>();
  messenger.registerActionHandler(
    'AccountsController:getAccount',
    getAccountHandler.mockReturnValue(
      mocks?.getAccount ?? defaultMockInternalAccount,
    ),
  );

  const getSelectedAccountHandler = jest.fn<InternalAccount, []>();
  messenger.registerActionHandler(
    'AccountsController:getSelectedAccount',
    getSelectedAccountHandler.mockReturnValue(
      mocks?.getSelectedAccount ?? defaultMockInternalAccount,
    ),
  );

  const mockListAccounts = jest.fn().mockReturnValue(listAccounts);
  messenger.registerActionHandler(
    'AccountsController:listAccounts',
    mockListAccounts,
  );

  const controller = new TokensController({
    chainId: ChainId.mainnet,
    // The tests assume that this is set, but they shouldn't make that
    // assumption. But we have to do this due to a bug in TokensController
    // where the provider can possibly be `undefined` if `networkClientId` is
    // not specified.
    provider: new FakeProvider(),
    messenger: restrictedMessenger,
    ...options,
  });

  const triggerSelectedAccountChange = (internalAccount: InternalAccount) => {
    getAccountHandler.mockReturnValue(internalAccount);
    messenger.publish(
      'AccountsController:selectedEvmAccountChange',
      internalAccount,
    );
  };

  const triggerAccountRemoved = (accountAddress: string) => {
    messenger.publish('KeyringController:accountRemoved', accountAddress);
  };

  const changeNetwork = ({
    selectedNetworkClientId,
  }: {
    selectedNetworkClientId: NetworkClientId;
  }) => {
    messenger.publish('NetworkController:networkDidChange', {
      ...getDefaultNetworkControllerState(),
      selectedNetworkClientId,
    });
  };

  const getNetworkClientById = buildMockGetNetworkClientById(
    mockNetworkClientConfigurationsByNetworkClientId,
  );
  messenger.registerActionHandler(
    'NetworkController:getNetworkClientById',
    getNetworkClientById,
  );

  const triggerNetworkStateChange = (
    networkState: NetworkState,
    patches: Patch[],
  ) => {
    messenger.publish('NetworkController:stateChange', networkState, patches);
  };

  return await fn({
    controller,
    changeNetwork,
    messenger,
    approvalController,
    triggerSelectedAccountChange,
    triggerNetworkStateChange,
    triggerAccountRemoved,
    getAccountHandler,
    getSelectedAccountHandler,
  });
}

/**
 * Constructs an object that satisfies the Token shape for testing,
 * offering a default shape while allowing any property to be overridden.
 *
 * @param overrides - Properties to override the object with.
 * @returns The complete Token.
 */
function buildToken(overrides: Partial<Token> = {}): Token {
  // `Object.assign` allows for properties to be `undefined` in `overrides`,
  // and will copy them over
  return Object.assign(
    {
      address: '0x000000000000000000000000000000000000dEaD',
      decimals: 12,
      image: 'image',
      symbol: 'TOKEN',
    },
    overrides,
  );
}

/**
 * Constructs an object that satisfies the Token shape for testing,
 * offering a default shape (guaranteeing a name) while allowing any property to
 * be overridden.
 *
 * @param overrides - Properties to override the object with.
 * @returns The complete Token.
 */
function buildTokenWithName(
  overrides: Partial<Token> = {},
): Token & { name: string } {
  // `Object.assign` allows for properties to be `undefined` in `overrides`,
  // and will copy them over
  return Object.assign(
    {
      address: '0x000000000000000000000000000000000000dEaD',
      decimals: 12,
      image: 'image',
      name: 'Some Token',
      symbol: 'TOKEN',
    },
    overrides,
  );
}

/**
 * Builds a mock ERC20 standard.
 *
 * @param args - The arguments to this function.
 * @param args.tokenName - The desired return value of getTokenName.
 * @param args.tokenSymbol - The desired return value of getTokenSymbol.
 * @param args.tokenDecimals - The desired return value of getTokenDecimals.
 * @returns The mock ERC20 standard.
 */
function buildMockERC20Standard({
  tokenName = 'Some Token',
  tokenSymbol = 'TEST',
  tokenDecimals = '1',
}: {
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimals?: string;
} = {}): ERC20Standard {
  // @ts-expect-error This intentionally does not support all of the methods
  // for the standard, only the ones we care about
  return {
    getTokenName: async () => tokenName,
    getTokenSymbol: async () => tokenSymbol,
    getTokenDecimals: async () => tokenDecimals,
  };
}

/**
 * Builds a mock ERC20 standard from a Token object.
 *
 * @param token - The token to use. The token must have a name.
 * @returns The mock ERC20 standard.
 */
function buildMockERC20StandardFromToken(
  token: Token & { name: string },
): ERC20Standard {
  // @ts-expect-error This intentionally does not support all of the methods
  // for the standard, only the ones we care about
  return {
    getTokenName: async () => token.name,
    getTokenSymbol: async () => token.symbol,
    getTokenDecimals: async () => token.decimals.toString(),
  };
}

/**
 * Builds a mock ERC1155 standard.
 *
 * @param args - The arguments to this function.
 * @param args.contractSupportsBase1155Interface - The desired return value of
 * contractSupportsBase1155Interface.
 * @returns The mock ERC20 standard.
 */
function buildMockERC1155Standard({
  contractSupportsBase1155Interface,
}: {
  contractSupportsBase1155Interface: boolean;
}): ERC1155Standard {
  // @ts-expect-error This intentionally does not support all of the methods
  // for the standard, only the ones we care about
  return {
    contractSupportsBase1155Interface: async () =>
      contractSupportsBase1155Interface,
  };
}

/**
 * Builds a mock ERC721 contract (created via Ethers) for testing.
 *
 * @param args - The arguments to this function.
 * @param args.supportsInterface - Whether the contract will report as supporting
 * the given ERC721 ABI.
 * @returns The mock contract.
 */
function buildMockEthersERC721Contract({
  supportsInterface,
}: {
  supportsInterface: boolean;
}): Contract {
  // @ts-expect-error This intentionally does not support all of the methods
  // for the contract, only the ones we care about
  return {
    supportsInterface: async () => supportsInterface,
  };
}

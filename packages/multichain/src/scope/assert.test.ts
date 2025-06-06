import * as Utils from '@metamask/utils';

import {
  assertScopeSupported,
  assertScopesSupported,
  assertIsExternalScopesObject,
  assertIsInternalScopesObject,
  assertIsInternalScopeString,
} from './assert';
import { Caip25Errors } from './errors';
import * as Supported from './supported';
import type { NormalizedScopeObject } from './types';

jest.mock('./supported', () => ({
  isSupportedScopeString: jest.fn(),
  isSupportedNotification: jest.fn(),
  isSupportedMethod: jest.fn(),
}));

jest.mock('@metamask/utils', () => ({
  ...jest.requireActual('@metamask/utils'),
  isCaipChainId: jest.fn(),
  isCaipReference: jest.fn(),
  isCaipAccountId: jest.fn(),
}));

const MockSupported = jest.mocked(Supported);
const MockUtils = jest.mocked(Utils);

const validScopeObject: NormalizedScopeObject = {
  methods: [],
  notifications: [],
  accounts: [],
};

describe('Scope Assert', () => {
  beforeEach(() => {
    MockUtils.isCaipChainId.mockImplementation(() => true);
    MockUtils.isCaipReference.mockImplementation(() => true);
    MockUtils.isCaipAccountId.mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('assertScopeSupported', () => {
    const isEvmChainIdSupported = jest.fn();
    const isNonEvmScopeSupported = jest.fn();
    const getNonEvmSupportedMethods = jest.fn();

    describe('scopeString', () => {
      it('checks if the scopeString is supported', () => {
        try {
          assertScopeSupported('scopeString', validScopeObject, {
            isEvmChainIdSupported,
            isNonEvmScopeSupported,
            getNonEvmSupportedMethods,
          });
        } catch (err) {
          // noop
        }
        expect(MockSupported.isSupportedScopeString).toHaveBeenCalledWith(
          'scopeString',
          { isEvmChainIdSupported, isNonEvmScopeSupported },
        );
      });

      it('throws an error if the scopeString is not supported', () => {
        MockSupported.isSupportedScopeString.mockReturnValue(false);
        expect(() => {
          assertScopeSupported('scopeString', validScopeObject, {
            isEvmChainIdSupported,
            isNonEvmScopeSupported,
            getNonEvmSupportedMethods,
          });
        }).toThrow(Caip25Errors.requestedChainsNotSupportedError());
      });
    });

    describe('scopeObject', () => {
      beforeEach(() => {
        MockSupported.isSupportedScopeString.mockReturnValue(true);
      });

      it('checks if the methods are supported', () => {
        try {
          assertScopeSupported(
            'scopeString',
            {
              ...validScopeObject,
              methods: ['eth_chainId'],
            },
            {
              isEvmChainIdSupported,
              isNonEvmScopeSupported,
              getNonEvmSupportedMethods,
            },
          );
        } catch (err) {
          // noop
        }

        expect(MockSupported.isSupportedMethod).toHaveBeenCalledWith(
          'scopeString',
          'eth_chainId',
          {
            getNonEvmSupportedMethods,
          },
        );
      });

      it('throws an error if there are unsupported methods', () => {
        MockSupported.isSupportedMethod.mockReturnValue(false);
        expect(() => {
          assertScopeSupported(
            'scopeString',
            {
              ...validScopeObject,
              methods: ['eth_chainId'],
            },
            {
              isEvmChainIdSupported,
              isNonEvmScopeSupported,
              getNonEvmSupportedMethods,
            },
          );
        }).toThrow(Caip25Errors.requestedMethodsNotSupportedError());
      });

      it('checks if the notifications are supported', () => {
        MockSupported.isSupportedMethod.mockReturnValue(true);
        try {
          assertScopeSupported(
            'scopeString',
            {
              ...validScopeObject,
              notifications: ['chainChanged'],
            },
            {
              isEvmChainIdSupported,
              isNonEvmScopeSupported,
              getNonEvmSupportedMethods,
            },
          );
        } catch (err) {
          // noop
        }

        expect(MockSupported.isSupportedNotification).toHaveBeenCalledWith(
          'scopeString',
          'chainChanged',
        );
      });

      it('throws an error if there are unsupported notifications', () => {
        MockSupported.isSupportedMethod.mockReturnValue(true);
        MockSupported.isSupportedNotification.mockReturnValue(false);
        expect(() => {
          assertScopeSupported(
            'scopeString',
            {
              ...validScopeObject,
              notifications: ['chainChanged'],
            },
            {
              isEvmChainIdSupported,
              isNonEvmScopeSupported,
              getNonEvmSupportedMethods,
            },
          );
        }).toThrow(Caip25Errors.requestedNotificationsNotSupportedError());
      });

      it('does not throw if the scopeObject is valid', () => {
        MockSupported.isSupportedMethod.mockReturnValue(true);
        MockSupported.isSupportedNotification.mockReturnValue(true);
        expect(
          assertScopeSupported(
            'scopeString',
            {
              ...validScopeObject,
              methods: ['eth_chainId'],
              notifications: ['chainChanged'],
              accounts: ['eip155:1:0xdeadbeef'],
            },
            {
              isEvmChainIdSupported,
              isNonEvmScopeSupported,
              getNonEvmSupportedMethods,
            },
          ),
        ).toBeUndefined();
      });
    });
  });

  describe('assertScopesSupported', () => {
    const isEvmChainIdSupported = jest.fn();
    const isNonEvmScopeSupported = jest.fn();
    const getNonEvmSupportedMethods = jest.fn();

    it('does not throw an error if no scopes are defined', () => {
      expect(
        assertScopesSupported(
          {},
          {
            isEvmChainIdSupported,
            isNonEvmScopeSupported,
            getNonEvmSupportedMethods,
          },
        ),
      ).toBeUndefined();
    });

    it('throws an error if any scope is invalid', () => {
      MockSupported.isSupportedScopeString.mockReturnValue(false);

      expect(() => {
        assertScopesSupported(
          {
            'eip155:1': validScopeObject,
          },
          {
            isEvmChainIdSupported,
            isNonEvmScopeSupported,
            getNonEvmSupportedMethods,
          },
        );
      }).toThrow(Caip25Errors.requestedChainsNotSupportedError());
    });

    it('does not throw an error if all scopes are valid', () => {
      MockSupported.isSupportedScopeString.mockReturnValue(true);

      expect(
        assertScopesSupported(
          {
            'eip155:1': validScopeObject,
            'eip155:2': validScopeObject,
          },
          {
            isEvmChainIdSupported,
            isNonEvmScopeSupported,
            getNonEvmSupportedMethods,
          },
        ),
      ).toBeUndefined();
    });
  });

  describe('assertIsExternalScopesObject', () => {
    it('does not throw if passed obj is a valid ExternalScopesObject with all valid properties', () => {
      const obj = {
        'eip155:1': {
          references: ['reference1', 'reference2'],
          accounts: ['eip155:1:0x1234'],
          methods: ['method1', 'method2'],
          notifications: ['notification1'],
          rpcDocuments: ['doc1'],
          rpcEndpoints: ['endpoint1'],
        },
      };
      expect(() => assertIsExternalScopesObject(obj)).not.toThrow();
    });

    it('does not throw if passed obj is a valid ExternalScopesObject with some optional properties missing', () => {
      const obj = {
        accounts: ['eip155:1:0x1234'],
        methods: ['method1'],
      };
      expect(() => assertIsExternalScopesObject(obj)).not.toThrow();
    });

    it('throws an error if passed obj is not an object', () => {
      expect(() => assertIsExternalScopesObject(null)).toThrow(
        'ExternalScopesObject must be an object',
      );
      expect(() => assertIsExternalScopesObject(123)).toThrow(
        'ExternalScopesObject must be an object',
      );
      expect(() => assertIsExternalScopesObject('string')).toThrow(
        'ExternalScopesObject must be an object',
      );
    });

    it('throws and error if passed an object with an ExternalScopeObject value that is not an object', () => {
      expect(() => assertIsExternalScopesObject({ 'eip155:1': 123 })).toThrow(
        'ExternalScopeObject must be an object',
      );
    });

    it('throws an error if passed an object with a key that is not a valid ExternalScopeString', () => {
      MockUtils.isCaipChainId.mockReturnValue(false);

      expect(() =>
        assertIsExternalScopesObject({ 'invalid-scope-string': {} }),
      ).toThrow('scopeString is not a valid ExternalScopeString');
    });

    it('throws an error if passed an object with an ExternalScopeObject with a references property that is not an array', () => {
      const invalidExternalScopeObject = {
        'eip155:1': {
          references: 'not-an-array',
          accounts: ['eip155:1:0x1234'],
          methods: ['method1', 'method2'],
          notifications: ['notification1'],
          rpcDocuments: ['doc1'],
          rpcEndpoints: ['endpoint1'],
        },
      };
      expect(() =>
        assertIsExternalScopesObject(invalidExternalScopeObject),
      ).toThrow(
        'ExternalScopeObject.references must be an array of CaipReference',
      );
    });

    it('throws an error if references contains invalid CaipReference', () => {
      const invalidExternalScopeObject = {
        'eip155:1': {
          references: ['invalidRef'],
          accounts: ['eip155:1:0x1234'],
          methods: ['method1', 'method2'],
          notifications: ['notification1'],
          rpcDocuments: ['doc1'],
          rpcEndpoints: ['endpoint1'],
        },
      };
      jest
        .spyOn(Utils, 'isCaipReference')
        .mockImplementation((ref) => ref !== 'invalidRef');

      expect(() =>
        assertIsExternalScopesObject(invalidExternalScopeObject),
      ).toThrow(
        'ExternalScopeObject.references must be an array of CaipReference',
      );
    });

    it('throws an error if passed an object with an ExternalScopeObject with an accounts property that is not an array', () => {
      const invalidExternalScopeObject = {
        'eip155:1': {
          references: ['reference1', 'reference2'],
          accounts: 'not-an-array',
          methods: ['method1', 'method2'],
          notifications: ['notification1'],
          rpcDocuments: ['doc1'],
          rpcEndpoints: ['endpoint1'],
        },
      };
      expect(() =>
        assertIsExternalScopesObject(invalidExternalScopeObject),
      ).toThrow(
        'ExternalScopeObject.accounts must be an array of CaipAccountId',
      );
    });

    it('throws an error if accounts contains invalid CaipAccountId', () => {
      const invalidExternalScopeObject = {
        'eip155:1': {
          references: ['reference1', 'reference2'],
          accounts: ['eip155:1:0x1234', 'invalidAccount'],
          methods: ['method1', 'method2'],
          notifications: ['notification1'],
          rpcDocuments: ['doc1'],
          rpcEndpoints: ['endpoint1'],
        },
      };
      MockUtils.isCaipAccountId.mockImplementation(
        (id) => id !== 'invalidAccount',
      );
      expect(() =>
        assertIsExternalScopesObject(invalidExternalScopeObject),
      ).toThrow(
        'ExternalScopeObject.accounts must be an array of CaipAccountId',
      );
    });

    it('throws an error if passed an object with an ExternalScopeObject with a methods property that is not an array', () => {
      const invalidExternalScopeObject = {
        'eip155:1': {
          references: ['reference1', 'reference2'],
          accounts: ['eip155:1:0x1234'],
          methods: 'not-an-array',
          notifications: ['notification1'],
          rpcDocuments: ['doc1'],
          rpcEndpoints: ['endpoint1'],
        },
      };
      expect(() =>
        assertIsExternalScopesObject(invalidExternalScopeObject),
      ).toThrow('ExternalScopeObject.methods must be an array of strings');
    });

    it('throws an error if methods contains non-string elements', () => {
      const invalidExternalScopeObject = {
        'eip155:1': {
          references: ['reference1', 'reference2'],
          accounts: ['eip155:1:0x1234'],
          methods: ['method1', 123],
          notifications: ['notification1'],
          rpcDocuments: ['doc1'],
          rpcEndpoints: ['endpoint1'],
        },
      };
      expect(() =>
        assertIsExternalScopesObject(invalidExternalScopeObject),
      ).toThrow('ExternalScopeObject.methods must be an array of strings');
    });

    it('throws an error if passed an object with an ExternalScopeObject with a notifications property  that is not an array', () => {
      const invalidExternalScopeObject = {
        'eip155:1': {
          references: ['reference1', 'reference2'],
          accounts: ['eip155:1:0x1234'],
          methods: ['method1', 'method2'],
          notifications: 'not-an-array',
          rpcDocuments: ['doc1'],
          rpcEndpoints: ['endpoint1'],
        },
      };
      expect(() =>
        assertIsExternalScopesObject(invalidExternalScopeObject),
      ).toThrow(
        'ExternalScopeObject.notifications must be an array of strings',
      );
    });

    it('throws an error if notifications contains non-string elements', () => {
      const invalidExternalScopeObject = {
        'eip155:1': {
          references: ['reference1', 'reference2'],
          accounts: ['eip155:1:0x1234'],
          methods: ['method1', 'method2'],
          notifications: ['notification1', false],
          rpcDocuments: ['doc1'],
          rpcEndpoints: ['endpoint1'],
        },
      };
      expect(() =>
        assertIsExternalScopesObject(invalidExternalScopeObject),
      ).toThrow(
        'ExternalScopeObject.notifications must be an array of strings',
      );
    });

    it('throws an error if passed an object with an ExternalScopeObject with a rpcDocuments property   that is not an array', () => {
      const invalidExternalScopeObject = {
        'eip155:1': {
          references: ['reference1', 'reference2'],
          accounts: ['eip155:1:0x1234'],
          methods: ['method1', 'method2'],
          notifications: ['notification1'],
          rpcDocuments: 'not-an-array',
          rpcEndpoints: ['endpoint1'],
        },
      };
      expect(() =>
        assertIsExternalScopesObject(invalidExternalScopeObject),
      ).toThrow('ExternalScopeObject.rpcDocuments must be an array of strings');
    });

    it('throws an error if rpcDocuments contains non-string elements', () => {
      const invalidExternalScopeObject = {
        'eip155:1': {
          references: ['reference1', 'reference2'],
          accounts: ['eip155:1:0x1234'],
          methods: ['method1', 'method2'],
          notifications: ['notification1'],
          rpcDocuments: ['doc1', 456],
          rpcEndpoints: ['endpoint1'],
        },
      };
      expect(() =>
        assertIsExternalScopesObject(invalidExternalScopeObject),
      ).toThrow('ExternalScopeObject.rpcDocuments must be an array of strings');
    });

    it('throws an error if passed an object with an ExternalScopeObject with a rpcEndpoints property that is not an array', () => {
      const invalidExternalScopeObject = {
        'eip155:1': {
          references: ['reference1', 'reference2'],
          accounts: ['eip155:1:0x1234'],
          methods: ['method1', 'method2'],
          notifications: ['notification1'],
          rpcDocuments: ['doc1'],
          rpcEndpoints: 'not-an-array',
        },
      };
      expect(() =>
        assertIsExternalScopesObject(invalidExternalScopeObject),
      ).toThrow('ExternalScopeObject.rpcEndpoints must be an array of strings');
    });

    it('throws an error if passed an object with an ExternalScopeObject with a rpcEndpoints property that contains non-string elements', () => {
      const invalidExternalScopeObject = {
        'eip155:1': {
          references: ['reference1', 'reference2'],
          accounts: ['eip155:1:0x1234'],
          methods: ['method1', 'method2'],
          notifications: ['notification1'],
          rpcDocuments: ['doc1'],
          rpcEndpoints: ['endpoint1', null],
        },
      };
      expect(() =>
        assertIsExternalScopesObject(invalidExternalScopeObject),
      ).toThrow('ExternalScopeObject.rpcEndpoints must be an array of strings');
    });
  });

  describe('assertIsInternalScopeString', () => {
    it('throws an error if the value is not a string', () => {
      expect(() => assertIsInternalScopeString({})).toThrow(
        'scopeString is not a valid InternalScopeString',
      );
      expect(() => assertIsInternalScopeString(123)).toThrow(
        'scopeString is not a valid InternalScopeString',
      );
      expect(() => assertIsInternalScopeString(undefined)).toThrow(
        'scopeString is not a valid InternalScopeString',
      );
      expect(() => assertIsInternalScopeString(null)).toThrow(
        'scopeString is not a valid InternalScopeString',
      );
    });

    it("does not throw an error if the value is 'wallet'", () => {
      expect(assertIsInternalScopeString('wallet')).toBeUndefined();
      expect(MockUtils.isCaipChainId).not.toHaveBeenCalled();
    });

    it('does not throw an error if the value is a valid CAIP-2 Chain ID', () => {
      MockUtils.isCaipChainId.mockReturnValue(true);

      expect(assertIsInternalScopeString('scopeString')).toBeUndefined();
      expect(MockUtils.isCaipChainId).toHaveBeenCalledWith('scopeString');
    });

    it('throws an error if the value is not a valid CAIP-2 Chain ID', () => {
      MockUtils.isCaipChainId.mockReturnValue(false);

      expect(() => assertIsInternalScopeString('scopeString')).toThrow(
        'scopeString is not a valid InternalScopeString',
      );
      expect(MockUtils.isCaipChainId).toHaveBeenCalledWith('scopeString');
    });
  });

  describe('assertIsInternalScopesObject', () => {
    it('does not throw if passed obj is a valid InternalScopesObject with all valid properties', () => {
      const obj = {
        'eip155:1': {
          accounts: ['eip155:1:0x1234'],
        },
      };
      expect(() => assertIsInternalScopesObject(obj)).not.toThrow();
    });

    it('throws an error if passed obj is not an object', () => {
      expect(() => assertIsInternalScopesObject(null)).toThrow(
        'InternalScopesObject must be an object',
      );
      expect(() => assertIsInternalScopesObject(123)).toThrow(
        'InternalScopesObject must be an object',
      );
      expect(() => assertIsInternalScopesObject('string')).toThrow(
        'InternalScopesObject must be an object',
      );
    });

    it('throws an error if passed an object with an InternalScopeObject value that is not an object', () => {
      expect(() => assertIsInternalScopesObject({ 'eip155:1': 123 })).toThrow(
        'InternalScopeObject must be an object',
      );
    });

    it('throws an error if passed an object with a key that is not a valid InternalScopeString', () => {
      MockUtils.isCaipChainId.mockReturnValue(false);

      expect(() =>
        assertIsInternalScopesObject({ 'invalid-scope-string': {} }),
      ).toThrow('scopeString is not a valid InternalScopeString');
    });

    it('throws an error if passed an object with an InternalScopeObject without an accounts property', () => {
      const invalidInternalScopeObject = {
        'eip155:1': {},
      };
      expect(() =>
        assertIsInternalScopesObject(invalidInternalScopeObject),
      ).toThrow(
        'InternalScopeObject.accounts must be an array of CaipAccountId',
      );
    });

    it('throws an error if passed an object with an InternalScopeObject with an accounts property that is not an array', () => {
      const invalidInternalScopeObject = {
        'eip155:1': {
          accounts: 'not-an-array',
        },
      };
      expect(() =>
        assertIsInternalScopesObject(invalidInternalScopeObject),
      ).toThrow(
        'InternalScopeObject.accounts must be an array of CaipAccountId',
      );
    });

    it('throws an error if accounts contains invalid CaipAccountId', () => {
      const invalidInternalScopeObject = {
        'eip155:1': {
          accounts: ['eip155:1:0x1234', 'invalidAccount'],
        },
      };
      MockUtils.isCaipAccountId.mockImplementation(
        (id) => id !== 'invalidAccount',
      );
      expect(() =>
        assertIsInternalScopesObject(invalidInternalScopeObject),
      ).toThrow(
        'InternalScopeObject.accounts must be an array of CaipAccountId',
      );
    });
  });
});

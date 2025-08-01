# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/accounts-controller` from `^31.0.0` to `^32.0.0` ([#6171](https://github.com/MetaMask/core/pull/6171))
- **BREAKING:** Bump peer dependency `@metamask/snaps-controllers` from `^12.0.0` to `^14.0.0` ([#6035](https://github.com/MetaMask/core/pull/6035))
- Bump `@metamask/snaps-sdk` from `^7.1.0` to `^9.0.0` ([#6035](https://github.com/MetaMask/core/pull/6035))
- Bump `@metamask/snaps-utils` from `^9.4.0` to `^11.0.0` ([#6035](https://github.com/MetaMask/core/pull/6035))
- Bump `@metamask/keyring-api` from `^18.0.0` to `^19.0.0` ([#6146](https://github.com/MetaMask/core/pull/6146))
- Bump `@metamask/keyring-internal-api` from `^6.2.0` to `^7.0.0` ([#6146](https://github.com/MetaMask/core/pull/6146))
- Bump `@metamask/keyring-snap-client` from `^5.0.0` to `^6.0.0` ([#6146](https://github.com/MetaMask/core/pull/6146))
- Bump `@metamask/utils` from `^11.2.0` to `^11.4.2` ([#6054](https://github.com/MetaMask/core/pull/6054))

## [3.0.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/accounts-controller` to `^31.0.0` ([#5999](https://github.com/MetaMask/core/pull/5999))
- Bump `@metamask/polling-controller` to `^14.0.0` ([#5999](https://github.com/MetaMask/core/pull/5999))

## [2.0.0]

### Changed

- **BREAKING:** Bump `@metamask/accounts-controller` peer dependency to `^30.0.0` ([#5888](https://github.com/MetaMask/core/pull/5888))
- **BREAKING:** Bump `@metamask/snaps-controllers` peer dependency from `^11.0.0` to `^12.0.0` ([#5871](https://github.com/MetaMask/core/pull/5871))
- Bump `@metamask/keyring-api` peer dependency from `^17.4.0` to `^18.0.0` ([#5871](https://github.com/MetaMask/core/pull/5871))
- Bump `@metamask/keyring-internal-api` dependency from `^6.0.1` to `^6.2.0` ([#5871](https://github.com/MetaMask/core/pull/5871))
- Bump `@metamask/keyring-snap-client` dependency from `^4.1.0` to `^5.0.0` ([#5871](https://github.com/MetaMask/core/pull/5871))
- Bump `@metamask/snaps-sdk` dependency from `^6.22.0` to `^7.0.0` ([#5871](https://github.com/MetaMask/core/pull/5871))
- Bump `@metamask/snaps-utils` dependency from `^9.2.0` to `^9.4.0` ([#5871](https://github.com/MetaMask/core/pull/5871))

## [1.0.0]

### Changed

- **BREAKING:** Store transactions by chain IDs ([#5756](https://github.com/MetaMask/core/pull/5756))
- Remove Solana mainnet filtering to support other Solana networks (devnet, testnet) ([#5756](https://github.com/MetaMask/core/pull/5756))

## [0.11.0]

### Changed

- **BREAKING:** bump `@metamask/accounts-controller` peer dependency to `^29.0.0` ([#5802](https://github.com/MetaMask/core/pull/5802))

## [0.10.0]

### Changed

- **BREAKING:** Bump `@metamask/accounts-controllers` peer dependency to `^28.0.0` ([#5763](https://github.com/MetaMask/core/pull/5763))
- **BREAKING:** Bump `@metamask/snaps-controllers` peer dependency to `^11.0.0` ([#5639](https://github.com/MetaMask/core/pull/5639))
- Bump `@metamask/base-controller` from `^8.0.0` to `^8.0.1` ([#5722](https://github.com/MetaMask/core/pull/5722))
- Bump `@metamask/snaps-sdk` from `^6.17.1` to `^6.22.0` ([#5639](https://github.com/MetaMask/core/pull/5639))
- Bump `@metamask/snaps-utils` from `^8.10.0` to `^9.2.0` ([#5639](https://github.com/MetaMask/core/pull/5639))

## [0.9.0]

### Added

- Send new `MultichainTransactionsController:transaction{Confirmed,Submitted}` events during transaction updates ([#5587](https://github.com/MetaMask/core/pull/5587))

## [0.8.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/accounts-controller` to `^27.0.0` ([#5507](https://github.com/MetaMask/core/pull/5507))
- Bump `@metamask/polling-controller` to `^13.0.0` ([#5507](https://github.com/MetaMask/core/pull/5507))

## [0.7.2]

### Fixed

- Filters out non-mainnet Solana transactions from the transactions update events ([#5497](https://github.com/MetaMask/core/pull/5497))
- `@metamask/snaps-controllers` peer dependency is no longer also a direct dependency ([#5464](https://github.com/MetaMask/core/pull/5464))

## [0.7.1]

### Fixed

- Check if `KeyringController` is unlocked before processing account events in `MultichainTransactionsController` ([#5473](https://github.com/MetaMask/core/pull/5473))
  - This is needed since some Snaps might decrypt their state which needs the `KeyringController` to be unlocked.

## [0.7.0]

### Changed

- **BREAKING:** Bump `@metamask/accounts-controller` peer dependency to `^26.0.0` ([#5439](https://github.com/MetaMask/core/pull/5439))
- **BREAKING:** Bump `@metamask/keyring-internal-api` from `^5.0.0` to `^6.0.0` ([#5347](https://github.com/MetaMask/core/pull/5347))

## [0.6.0]

### Changed

- **BREAKING:** Bump `@metamask/accounts-controller` peer dependency to `^25.0.0` ([#5426](https://github.com/MetaMask/core/pull/5426))
- Bump `@metamask/keyring-internal-api` from `^4.0.3` to `^5.0.0` ([#5405](https://github.com/MetaMask/core/pull/5405))

## [0.5.0]

### Changed

- Sort transactions (newest first) ([#5339](https://github.com/MetaMask/core/pull/5339))
- Bump `@metamask/keyring-controller"` from `^19.1.0` to `^19.2.0` ([#5357](https://github.com/MetaMask/core/pull/5357))
- Bump `@metamask/keyring-api"` from `^17.0.0` to `^17.2.0` ([#5366](https://github.com/MetaMask/core/pull/5366))
- Bump `@metamask/keyring-internal-api` from `^4.0.1` to `^4.0.3` ([#5356](https://github.com/MetaMask/core/pull/5356)), ([#5366](https://github.com/MetaMask/core/pull/5366))
- Bump `@metamask/keyring-snap-client` from `^3.0.3` to `^4.0.1` ([#5356](https://github.com/MetaMask/core/pull/5356)), ([#5366](https://github.com/MetaMask/core/pull/5366))
- Bump `@metamask/utils` from `^11.1.0` to `^11.2.0` ([#5301](https://github.com/MetaMask/core/pull/5301))

### Fixed

- De-duplicate transactions using their ID ([#5339](https://github.com/MetaMask/core/pull/5339))

## [0.4.0]

### Changed

- **BREAKING:** Bump `@metamask/accounts-controller` peer dependency from `^23.0.0` to `^24.0.0` ([#5318](https://github.com/MetaMask/core/pull/5318))

## [0.3.0]

### Changed

- Bump `@metamask/base-controller` from `^7.1.1` to `^8.0.0` ([#5305](https://github.com/MetaMask/core/pull/5305))
- Bump `@metamask/polling-controller` from `^12.0.2` to `^12.0.3` ([#5305](https://github.com/MetaMask/core/pull/5305))

### Removed

- **BREAKING:** Remove `NETWORK_ASSETS_MAP`, `MultichainNetwork` and `MultichainNativeAsset` from exports, making them no longer available for consumers ([#5295](https://github.com/MetaMask/core/pull/5295))

## [0.2.0]

### Changed

- **BREAKING:** Bump `@metamask/accounts-controller` peer dependency from `^22.0.0` to `^23.0.0` ([#5292](https://github.com/MetaMask/core/pull/5292))
- **BREAKING:** Bump `@metamask/snaps-controllers` peer dependency from `^9.10.0` to `^9.19.0` ([#5265](https://github.com/MetaMask/core/pull/5265))
- Bump `@metamask/snaps-sdk` from `^6.7.0` to `^6.17.1` ([#5220](https://github.com/MetaMask/core/pull/5220)), ([#5265](https://github.com/MetaMask/core/pull/5265))
- Bump `@metamask/snaps-utils` from `^8.9.0` to `^8.10.0` ([#5265](https://github.com/MetaMask/core/pull/5265))
- Bump `@metamask/snaps-controllers` from `^9.10.0` to `^9.19.0` ([#5265](https://github.com/MetaMask/core/pull/5265))
- Bump `@metamask/keyring-api"` from `^16.1.0` to `^17.0.0` ([#5280](https://github.com/MetaMask/core/pull/5280))
- Bump `@metamask/utils` from `^11.0.1` to `^11.1.0` ([#5223](https://github.com/MetaMask/core/pull/5223))
- Removed polling mechanism and now relies on the new `AccountsController:accountTransactionsUpdated` event ([#5221](https://github.com/MetaMask/core/pull/5221))

## [0.1.0]

### Changed

- **BREAKING:** Bump `@metamask/accounts-controller` peer dependency from `^21.0.0` to `^22.0.0` ([#5218](https://github.com/MetaMask/core/pull/5218))
- Bump `@metamask/keyring-api` from `^14.0.0` to `^16.1.0` ([#5190](https://github.com/MetaMask/core/pull/5190)), ([#5208](https://github.com/MetaMask/core/pull/5208))
- Bump `@metamask/keyring-internal-api` from `^2.0.1` to `^4.0.1` ([#5190](https://github.com/MetaMask/core/pull/5190)), ([#5208](https://github.com/MetaMask/core/pull/5208))
- Bump `@metamask/keyring-snap-client` from `^3.0.0` to `^3.0.3` ([#5190](https://github.com/MetaMask/core/pull/5190)), ([#5208](https://github.com/MetaMask/core/pull/5208))

## [0.0.1]

### Added

- Initial release ([#5133](https://github.com/MetaMask/core/pull/5133)), ([#5177](https://github.com/MetaMask/core/pull/5177))

[Unreleased]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@4.0.0...HEAD
[4.0.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@3.0.0...@metamask/multichain-transactions-controller@4.0.0
[3.0.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@2.0.0...@metamask/multichain-transactions-controller@3.0.0
[2.0.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@1.0.0...@metamask/multichain-transactions-controller@2.0.0
[1.0.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@0.11.0...@metamask/multichain-transactions-controller@1.0.0
[0.11.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@0.10.0...@metamask/multichain-transactions-controller@0.11.0
[0.10.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@0.9.0...@metamask/multichain-transactions-controller@0.10.0
[0.9.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@0.8.0...@metamask/multichain-transactions-controller@0.9.0
[0.8.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@0.7.2...@metamask/multichain-transactions-controller@0.8.0
[0.7.2]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@0.7.1...@metamask/multichain-transactions-controller@0.7.2
[0.7.1]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@0.7.0...@metamask/multichain-transactions-controller@0.7.1
[0.7.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@0.6.0...@metamask/multichain-transactions-controller@0.7.0
[0.6.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@0.5.0...@metamask/multichain-transactions-controller@0.6.0
[0.5.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@0.4.0...@metamask/multichain-transactions-controller@0.5.0
[0.4.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@0.3.0...@metamask/multichain-transactions-controller@0.4.0
[0.3.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@0.2.0...@metamask/multichain-transactions-controller@0.3.0
[0.2.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@0.1.0...@metamask/multichain-transactions-controller@0.2.0
[0.1.0]: https://github.com/MetaMask/core/compare/@metamask/multichain-transactions-controller@0.0.1...@metamask/multichain-transactions-controller@0.1.0
[0.0.1]: https://github.com/MetaMask/core/releases/tag/@metamask/multichain-transactions-controller@0.0.1

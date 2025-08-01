# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add `group.type` tag ([#6214](https://github.com/MetaMask/core/pull/6214))
  - This `type` can be used as a tag to strongly-type (tagged-union) the `AccountGroupObject`.
- Add `group.metadata` metadata object ([#6214](https://github.com/MetaMask/core/pull/6214))
  - Given the `group.type` you will now have access to specific metadata information (e.g. `groupIndex` for multichain account groups)

### Changed

- **BREAKING:** Bump peer dependency `@metamask/account-api` from `^0.3.0` to `^0.6.0` ([#6214](https://github.com/MetaMask/core/pull/6214)), ([#6216](https://github.com/MetaMask/core/pull/6216))
- **BREAKING:** Move `wallet.metadata.type` tag to `wallet` node ([#6214](https://github.com/MetaMask/core/pull/6214))
  - This `type` can be used as a tag to strongly-type (tagged-union) the `AccountWalletObject`.
- Defaults to the EVM account from a group when using `setSelectedAccountGroup` ([#6208](https://github.com/MetaMask/core/pull/6208))
  - In case no EVM accounts are found in a group (which should not be possible), it will defaults to the first account of that group.

## [0.7.0]

### Added

- Add BIP-44/multichain accounts support ([#6185](https://github.com/MetaMask/core/pull/6185))
  - Those are being attached to the `entropy` wallet category.

### Changed

- **BREAKING:** Bump peer dependency `@metamask/account-api` from `^0.2.0` to `^0.3.0` ([#6165](https://github.com/MetaMask/core/pull/6165))
- Add `selectedAccountGroup` state and bidirectional synchronization with `AccountsController` ([#6186](https://github.com/MetaMask/core/pull/6186))
  - New `getSelectedAccountGroup()` and `setSelectedAccountGroup()` methods.
  - Automatic synchronization when selected account changes in AccountsController.
  - New action types `AccountTreeControllerGetSelectedAccountGroupAction` and `AccountTreeControllerSetSelectedAccountGroupAction`.
- Now use one account group per account for `snap` and `keyring` wallet categories ([#6185](https://github.com/MetaMask/core/pull/6185))
  - We used to group all accounts under the `'default'` group, but we now compute the group ID using the address of each accounts.
- Compute account group name based on their underlying account. ([#6185](https://github.com/MetaMask/core/pull/6185))
  - This replaces the previous `'Default'` name for groups.

## [0.6.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/accounts-controller` from `^31.0.0` to `^32.0.0` ([#6171](https://github.com/MetaMask/core/pull/6171))

## [0.5.0]

### Changed

- **BREAKING:** Add `@metamask/account-api` peer dependency ([#6115](https://github.com/MetaMask/core/pull/6115)), ([#6146](https://github.com/MetaMask/core/pull/6146))
- **BREAKING:** Types `AccountWallet` and `AccountGroup` have been respectively renamed to `AccountWalletObject` and `AccountGroupObject` ([#6115](https://github.com/MetaMask/core/pull/6115))
  - Those names are now used by the `@metamask/account-api` package to define higher-level interfaces.
- **BREAKING:** Bump peer dependency `@metamask/snaps-controllers` from `^12.0.0` to `^14.0.0` ([#6035](https://github.com/MetaMask/core/pull/6035))
- Bump `@metamask/snaps-sdk` from `^7.1.0` to `^9.0.0` ([#6035](https://github.com/MetaMask/core/pull/6035))
- Bump `@metamask/snaps-utils` from `^9.4.0` to `^11.0.0` ([#6035](https://github.com/MetaMask/core/pull/6035))
- Properly export `AccountWalletCategory` constant and conversion functions ([#6062](https://github.com/MetaMask/core/pull/6062))

### Removed

- **BREAKING:** No longer export `AccountWalletCategory`, `toAccountWalletId`, `toAccountGroupId` and `toDefaultAccountGroupId` ([#6115](https://github.com/MetaMask/core/pull/6115))
  - You should now import them from the `@metamask/account-api` package (peer dependency).

## [0.4.0]

### Changed

- Update wallet names ([#6024](https://github.com/MetaMask/core/pull/6024))

## [0.3.0]

### Added

- Export ID conversions functions and constants ([#6006](https://github.com/MetaMask/core/pull/6006))

## [0.2.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/accounts-controller` to `^31.0.0` ([#5999](https://github.com/MetaMask/core/pull/5999))

## [0.1.1]

### Fixed

- Fix `AccountWallet.metadata` type ([#5947](https://github.com/MetaMask/core/pull/5947))
  - Was using `AccountGroupMetadata` instead of `AccountWalletMetadata`.
- Add `AccountTreeControllerStateChangeEvent` to `AccountTreeControllerEvents` ([#5958](https://github.com/MetaMask/core/pull/5958))

## [0.1.0]

### Added

- Initial release ([#5847](https://github.com/MetaMask/core/pull/5847))
  - Grouping accounts into 3 main categories: Entropy source, Snap ID, keyring types.

[Unreleased]: https://github.com/MetaMask/core/compare/@metamask/account-tree-controller@0.7.0...HEAD
[0.7.0]: https://github.com/MetaMask/core/compare/@metamask/account-tree-controller@0.6.0...@metamask/account-tree-controller@0.7.0
[0.6.0]: https://github.com/MetaMask/core/compare/@metamask/account-tree-controller@0.5.0...@metamask/account-tree-controller@0.6.0
[0.5.0]: https://github.com/MetaMask/core/compare/@metamask/account-tree-controller@0.4.0...@metamask/account-tree-controller@0.5.0
[0.4.0]: https://github.com/MetaMask/core/compare/@metamask/account-tree-controller@0.3.0...@metamask/account-tree-controller@0.4.0
[0.3.0]: https://github.com/MetaMask/core/compare/@metamask/account-tree-controller@0.2.0...@metamask/account-tree-controller@0.3.0
[0.2.0]: https://github.com/MetaMask/core/compare/@metamask/account-tree-controller@0.1.1...@metamask/account-tree-controller@0.2.0
[0.1.1]: https://github.com/MetaMask/core/compare/@metamask/account-tree-controller@0.1.0...@metamask/account-tree-controller@0.1.1
[0.1.0]: https://github.com/MetaMask/core/releases/tag/@metamask/account-tree-controller@0.1.0

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [32.0.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/accounts-controller` to `^32.0.0` ([#6171](https://github.com/MetaMask/core/pull/6171))

## [31.0.1]

### Changed

- Bump `@metamask/controller-utils` from `^11.10.0` to `^11.11.0` ([#6069](https://github.com/MetaMask/core/pull/6069))
  - This upgrade includes performance improvements to checksum hex address normalization
- Bump `@metamask/utils` from `^11.2.0` to `^11.4.2` ([#6054](https://github.com/MetaMask/core/pull/6054))

## [31.0.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/accounts-controller` to `^31.0.0` ([#5999](https://github.com/MetaMask/core/pull/5999))
- **BREAKING:** Bump peer dependency `@metamask/network-controller` to `^24.0.0` ([#5999](https://github.com/MetaMask/core/pull/5999))
- Bump `@metamask/controller-utils` to `^11.10.0` ([#5935](https://github.com/MetaMask/core/pull/5935))

## [30.0.0]

### Changed

- **BREAKING:** bump `@metamask/accounts-controller` peer dependency to `^30.0.0` ([#5888](https://github.com/MetaMask/core/pull/5888))
- Bump `@metamask/controller-utils` to `^11.9.0` ([#5812](https://github.com/MetaMask/core/pull/5812))

## [29.0.0]

### Changed

- **BREAKING:** bump `@metamask/keyring-controller` peer dependency to `^22.0.0` ([#5802](https://github.com/MetaMask/core/pull/5802))
- **BREAKING:** bump `@metamask/accounts-controller` peer dependency to `^29.0.0` ([#5802](https://github.com/MetaMask/core/pull/5802))
- Bump `@metamask/controller-utils` to `^11.8.0` ([#5765](https://github.com/MetaMask/core/pull/5765))

## [28.0.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/accounts-controller` to `^28.0.0` ([#5763](https://github.com/MetaMask/core/pull/5763))
- Bump `@metamask/base-controller` from ^8.0.0 to ^8.0.1 ([#5722](https://github.com/MetaMask/core/pull/5722))

## [27.1.0]

### Changed

- Bump `@metamask/controller-utils` to `^11.7.0` ([#5583](https://github.com/MetaMask/core/pull/5583))

### Fixed

- Stop throwing an error if `verifyingContract` field in EIP712 payloads is undefined or not a string ([#5595](https://github.com/MetaMask/core/pull/5595))

## [27.0.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/accounts-controller` to `^27.0.0` ([#5507](https://github.com/MetaMask/core/pull/5507))
- **BREAKING:** Bump peer dependency `@metamask/network-controller` to `^23.0.0` ([#5507](https://github.com/MetaMask/core/pull/5507))

## [26.0.0]

### Added

- **BREAKING:** Add peer dependency on `^26.0.0` of `@metamask/accounts-controller`([#5470](https://github.com/MetaMask/core/pull/5470))
- Add EIP-7702 signature validations ([#5470](https://github.com/MetaMask/core/pull/5470))
  - Throw if external and `verifyingContract` matches any internal account.
  - Throw if external and `primaryType` is `Delegation` and `delegator` matches any internal EOA account.

### Changed

- Bump `@metamask/accounts-controller` peer dependency to `^26.1.0` ([#5481](https://github.com/MetaMask/core/pull/5481))

## [25.0.0]

### Changed

- **BREAKING:** Bump `@metamask/keyring-controller` peer dependency to `^21.0.0` ([#5439](https://github.com/MetaMask/core/pull/5439))

## [24.0.0]

### Changed

- **BREAKING:** Bump `@metamask/keyring-controller` peer dependency to `^20.0.0` ([#5426](https://github.com/MetaMask/core/pull/5426))
- Bump `@metamask/utils` from `^11.1.0` to `^11.2.0` ([#5301](https://github.com/MetaMask/core/pull/5301))

## [23.2.1]

### Changed

- Bump `@metamask/base-controller` from `^7.1.0` to `^8.0.0` ([#5135](https://github.com/MetaMask/core/pull/5135)), ([#5305](https://github.com/MetaMask/core/pull/5305))
- Bump `@metamask/controller-utils` from `^11.4.4` to `^11.5.0` ([#5135](https://github.com/MetaMask/core/pull/5135)), ([#5272](https://github.com/MetaMask/core/pull/5272))
- Bump `@metamask/utils` from `^11.0.1` to `^11.1.0` ([#5223](https://github.com/MetaMask/core/pull/5223))

## [23.2.0]

### Changed

- Bump `@metamask/utils` to `^11.0.1` and `@metamask/rpc-errors` to `^7.0.2` ([#5080](https://github.com/MetaMask/core/pull/5080))
- Bump `@metamask/keyring-controller` from `19.0.1` to `19.0.2` ([#5058](https://github.com/MetaMask/core/pull/5058))
- Bump `@metamask/network-controller` from `22.1.0` to `^22.1.1` ([#5038](https://github.com/MetaMask/core/pull/5038))
- Bump `@metamask/base-controller` from `^7.0.0` to `^7.1.0` ([#5079](https://github.com/MetaMask/core/pull/5079))

### Fixed

- Align signature request and message params ID ([#5102](https://github.com/MetaMask/core/pull/5102))

## [23.1.0]

### Changed

- fix: Fixes in signature decoding functionality ([#5028](https://github.com/MetaMask/core/pull/5028))
- fix: signature decoding api should be called for typed sign V3 also ([#5033](https://github.com/MetaMask/core/pull/5033))
- fix: Revert `eth-sig-util` package ([#5027](https://github.com/MetaMask/core/pull/5027))
- fix: Update `jsonschema` version & `eth-sig-util` ([#4998](https://github.com/MetaMask/core/pull/4998))

## [23.0.1]

### Changed

- Bump `@metamask/controller-utils` from `^11.4.3` to `^11.4.4` ([#5012](https://github.com/MetaMask/core/pull/5012))

### Fixed

- Correct ESM-compatible build so that imports of the following packages that re-export other modules via `export *` are no longer corrupted: ([#5011](https://github.com/MetaMask/core/pull/5011))
  - `@metamask/eth-sig-util`

## [23.0.0]

### Changed

- **BREAKING:** Bump `@metamask/keyring-controller` peer dependency from `^18.0.0` to `^19.0.0` ([#4195](https://github.com/MetaMask/core/pull/4956))

## [22.0.0]

### Changed

- **BREAKING:** Bump `@metamask/keyring-controller` peer dependency from `^17.0.0` to `^18.0.0` ([#4915](https://github.com/MetaMask/core/pull/4915))
- Bump `@metamask/controller-utils` from `^11.4.2` to `^11.4.3` ([#4915](https://github.com/MetaMask/core/pull/4915))

## [21.1.0]

### Added

- Add `isDecodeSignatureRequestEnabled` constructor callback to determine if decoding API should be used ([#4903](https://github.com/MetaMask/core/pull/4903))
- Add `decodingApiUrl` constructor property to specify URL of API to provide additional decoding data. ([#4855](https://github.com/MetaMask/core/pull/4855))

## [21.0.0]

### Added

- Add `chainId` and `networkClientId` to `SignatureRequest` and `LegacyStateMessage` types ([#4797](https://github.com/MetaMask/core/pull/4797))
- Add `networkClientId` to `OriginalRequest` type ([#4797](https://github.com/MetaMask/core/pull/4797))

### Changed

- **BREAKING:** Make `request` argument required in `newUnsignedPersonalMessage` and `newUnsignedTypedMessage` methods ([#4797](https://github.com/MetaMask/core/pull/4797))
- Throw if no `networkClientId` in `request` or if chain ID cannot be determined ([#4797](https://github.com/MetaMask/core/pull/4797))
- Bump `@metamask/approval-controller` from `^7.1.0` to `^7.1.1` ([#4862](https://github.com/MetaMask/core/pull/4862))
- Bump `@metamask/controller-utils` from `^11.4.0` to `^11.4.1` ([#4862](https://github.com/MetaMask/core/pull/4862))
- Bump `@metamask/base-controller` from `7.0.1` to `^7.0.2` ([#4862](https://github.com/MetaMask/core/pull/4862))
- Bump `@metamask/utils` from `^9.1.0` to `^10.0.0` ([#4831](https://github.com/MetaMask/core/pull/4831))
- Bump `@metamask/controller-utils` from `^11.3.0` to `^11.4.0` ([#4834](https://github.com/MetaMask/core/pull/4834))

### Removed

- Remove `getCurrentChainId` and `getAllState` callbacks from constructor options ([#4797](https://github.com/MetaMask/core/pull/4797))

## [20.1.0]

### Added

- Add additional properties to message parameter types ([#4822](https://github.com/MetaMask/core/pull/4822))
  - Add `metamaskId` to `MessageParams`.
  - Add `version` to `MessageParamsTyped`.

### Changed

- Update required arguments in methods ([#4822](https://github.com/MetaMask/core/pull/4822))
  - Make `request` argument optional in `newUnsignedPersonalMessage` and `newUnsignedTypedMessage`.
  - Make `signingOptions` argument optional in `newUnsignedTypedMessage`.
- Bump `eth-sig-util` from `^7.0.1` to `^8.0.0` ([#4830](https://github.com/MetaMask/core/pull/4830))
- Bump `@metamask/keyring-controller` from `^17.2.2` to `^17.3.0` ([#4643](https://github.com/MetaMask/core/pull/4643))

## [20.0.0]

### Added

- Remove usage of `@metamask/message-manager` package ([#4785](https://github.com/MetaMask/core/pull/4785))
  - Add `signatureRequests` object to state to include all messages with all types and statuses.
  - Add optional `state` option to constructor to provide initial state.
  - Add equivalent types formerly in `@metamask/message-manager`:
    - `OriginalRequest`
    - `TypedSigningOptions`
    - `MessageParams`
    - `MessageParamsPersonal`
    - `MessageParamsTyped`
    - `SignatureRequest`
    - `SignatureRequestStatus`
    - `SignatureRequestType`

### Changed

- Remove usage of `@metamask/message-manager` package ([#4785](https://github.com/MetaMask/core/pull/4785))
  - **BREAKING** Change `type` property in message state to enum values rather than `string`.
  - Deprecate the following state since the same data can be derived from `signatureRequests`:
    - `unapprovedPersonalMsgs`
    - `unapprovedTypedMessages`
    - `unapprovedPersonalMsgCount`
    - `unapprovedTypedMessagesCount`
  - Deprecate the following properties since the same data can be derived from the state:
    - `unapprovedPersonalMessagesCount`
    - `unapprovedTypedMessagesCount`
    - `messages`
  - Deprecate the following constructor options since they are no longer used:
    - `getAllState`
    - `securityProviderRequest`

## [19.1.0]

### Added

- Add initial tracing to `SignatureController` ([#4655](https://github.com/MetaMask/core/pull/4655))
  - Adds an optional `trace` callback to the constructor, and an optional
    `traceContext` option to the `newUnsignedTypedMessage` and
    `newUnsignedPersonalMessage` methods.

### Fixed

- Produce and export ESM-compatible TypeScript type declaration files in addition to CommonJS-compatible declaration files ([#4648](https://github.com/MetaMask/core/pull/4648))
  - Previously, this package shipped with only one variant of type declaration
    files, and these files were only CommonJS-compatible, and the `exports`
    field in `package.json` linked to these files. This is an anti-pattern and
    was rightfully flagged by the
    ["Are the Types Wrong?"](https://arethetypeswrong.github.io/) tool as
    ["masquerading as CJS"](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FalseCJS.md).
    All of the ATTW checks now pass.
- Remove chunk files ([#4648](https://github.com/MetaMask/core/pull/4648)).
  - Previously, the build tool we used to generate JavaScript files extracted
    common code to "chunk" files. While this was intended to make this package
    more tree-shakeable, it also made debugging more difficult for our
    development teams. These chunk files are no longer present.

## [19.0.0]

### Changed

- **BREAKING:** Bump dependency and peerDependency `@metamask/logging-controller` from `^5.0.0` to `^6.0.0` ([#4643](https://github.com/MetaMask/core/pull/4643))
- Bump `@metamask/base-controller` from `^6.0.2` to `^7.0.0` ([#4625](https://github.com/MetaMask/core/pull/4625), [#4643](https://github.com/MetaMask/core/pull/4643))
- Bump `@metamask/message-manager` from `^10.0.2` to `^10.0.3` ([#4643](https://github.com/MetaMask/core/pull/4643))
- Bump `typescript` from `~5.0.4` to `~5.2.2` ([#4576](https://github.com/MetaMask/core/pull/4576), [#4584](https://github.com/MetaMask/core/pull/4584))

## [18.1.0]

### Changed

- Throw exact error provided by client on rejection ([#4610](https://github.com/MetaMask/core/pull/4610))
- Upgrade TypeScript version to `~5.2.2` ([#4584](https://github.com/MetaMask/core/pull/4584))
- Upgrade TypeScript version to `~5.1.6` ([#4576](https://github.com/MetaMask/core/pull/4576))

### Removed

- Remove `@metamask/rpc-errors` dependency ([#4610](https://github.com/MetaMask/core/pull/4610))

## [18.0.1]

### Changed

- Remove `@metamask/approval-controller`, `@metamask/keyring-controller`, and `@metamask/logging-controller` dependencies [#4556](https://github.com/MetaMask/core/pull/4556)
  - These were listed under `peerDependencies` already, so they were redundant as dependencies.
- Upgrade TypeScript version to `~5.0.4` and set `moduleResolution` option to `Node16` ([#3645](https://github.com/MetaMask/core/pull/3645))
- Bump `@metamask/base-controller` from `^6.0.0` to `^6.0.2` ([#4517](https://github.com/MetaMask/core/pull/4517), [#4544](https://github.com/MetaMask/core/pull/4544))
- Bump `@metamask/controller-utils` from `^11.0.0` to `^11.0.2` ([#4517](https://github.com/MetaMask/core/pull/4517), [#4544](https://github.com/MetaMask/core/pull/4544))
- Bump `@metamask/message-manager` from `^10.0.0` to `^10.0.2` ([#4527](https://github.com/MetaMask/core/pull/4527), (#4548)[https://github.com/MetaMask/core/pull/4548])
- Bump `@metamask/rpc-errors` from `^6.2.1` to `^6.3.1` ([#4516](https://github.com/MetaMask/core/pull/4516))
- Bump `@metamask/utils` from `^8.3.0` to `^9.1.0` ([#4516](https://github.com/MetaMask/core/pull/4516), [#4529](https://github.com/MetaMask/core/pull/4529))

## [18.0.0]

### Changed

- **BREAKING:** Bump minimum Node version to 18.18 ([#3611](https://github.com/MetaMask/core/pull/3611))
- **BREAKING:** Bump dependency and peer dependency `@metamask/approval-controller` to `^7.0.0` ([#4352](https://github.com/MetaMask/core/pull/4352))
- **BREAKING:** Bump dependency and peer dependency `@metamask/keyring-controller` to `^17.0.0` ([#4352](https://github.com/MetaMask/core/pull/4352))
- **BREAKING:** Bump dependency and peer dependency `@metamask/logging-controller` to `^5.0.0` ([#4352](https://github.com/MetaMask/core/pull/4352))
- Bump `@metamask/base-controller` to `^6.0.0` ([#4352](https://github.com/MetaMask/core/pull/4352))
- Bump `@metamask/controller-utils` to `^11.0.0` ([#4352](https://github.com/MetaMask/core/pull/4352))
- Bump `@metamask/message-manager` to `^10.0.0` ([#4352](https://github.com/MetaMask/core/pull/4352))

## [17.0.0]

### Changed

- **BREAKING:** Update `messages` getter to return `Record<string, PersonalMessage | TypedMessage>` instead of `Record<string, Message | PersonalMessage | TypedMessage>` ([#4319](https://github.com/MetaMask/core/pull/4319))
- **BREAKING** Bump `@metamask/keyring-controller` peer dependency to `^16.1.0` ([#4342](https://github.com/MetaMask/core/pull/4342))
- **BREAKING** Bump `@metamask/logging-controller` peer dependency to `^4.0.0` ([#4342](https://github.com/MetaMask/core/pull/4342))
- Bump `@metamask/controller-utils` to `^10.0.0` ([#4342](https://github.com/MetaMask/core/pull/4342))
- Bump `@metamask/message-manager` to `^9.0.0` ([#4342](https://github.com/MetaMask/core/pull/4342))

### Removed

- **BREAKING:** Remove state properties `unapprovedMsgs` and `unapprovedMsgCount` ([#4319](https://github.com/MetaMask/core/pull/4319))
  - These properties were related to handling of the `eth_sign` RPC method, but support for that is being removed, so these are no longer needed.
- **BREAKING:** Remove `isEthSignEnabled` option from constructor ([#4319](https://github.com/MetaMask/core/pull/4319))
  - This option governed whether handling of the `eth_sign` RPC method was enabled, but support for that method is being removed, so this is no longer needed.
- **BREAKING:** Remove `newUnsignedMessage` method ([#4319](https://github.com/MetaMask/core/pull/4319))
  - This method was called when a dapp used the `eth_sign` RPC method, but support for that method is being removed, so this is no longer needed.

## [16.0.0]

### Changed

- **BREAKING** Bump `@metamask/keyring-controller` peer dependency to ^16.0.0 ([#4234](https://github.com/MetaMask/core/pull/4234))
- Bump `@metamask/base-controller` to `^5.0.2` ([#4232](https://github.com/MetaMask/core/pull/4232))
- Bump `@metamask/approval-controller` to `^6.0.2` ([#4234](https://github.com/MetaMask/core/pull/4234))
- Bump `@metamask/message-manager` to `^8.0.2` ([#4234](https://github.com/MetaMask/core/pull/4234))

## [15.0.0]

### Changed

- **BREAKING** Bump peer dependency on `@metamask/keyring-controller` to `^15.0.0` ([#4090](https://github.com/MetaMask/core/pull/4090))

## [14.0.1]

### Fixed

- Fix `types` field in `package.json` ([#4047](https://github.com/MetaMask/core/pull/4047))

## [14.0.0]

### Added

- **BREAKING**: Add ESM build ([#3998](https://github.com/MetaMask/core/pull/3998))
  - It's no longer possible to import files from `./dist` directly.

### Changed

- **BREAKING:** Bump dependency and peer dependency on `@metamask/approval-controller` to `^6.0.0` ([#4039](https://github.com/MetaMask/core/pull/4039))
- **BREAKING:** Bump `@metamask/base-controller` to `^5.0.0` ([#4039](https://github.com/MetaMask/core/pull/4039))
  - This version has a number of breaking changes. See the changelog for more.
- **BREAKING:** Bump dependency and peer dependency on `@metamask/keyring-controller` to `^14.0.0` ([#4039](https://github.com/MetaMask/core/pull/4039))
- **BREAKING:** Bump dependency and peer dependency on `@metamask/logging-controller` to `^3.0.0` ([#4039](https://github.com/MetaMask/core/pull/4039))
- Bump `@metamask/controller-utils` to `^9.0.0` ([#4039](https://github.com/MetaMask/core/pull/4039))
- Bump `@metamask/message-manager` to `^8.0.0` ([#4039](https://github.com/MetaMask/core/pull/4039))

## [13.0.0]

### Changed

- **BREAKING:** Bump `@metamask/keyring-controller` dependency and peer dependency to `^13.0.0` ([#4007](https://github.com/MetaMask/core/pull/4007))
- Bump `@metamask/approval-controller` to `^5.1.3` ([#4007](https://github.com/MetaMask/core/pull/4007))
- Bump `@metamask/controller-utils` to `^8.0.4` ([#4007](https://github.com/MetaMask/core/pull/4007))
- Bump `@metamask/logging-controller` to `^2.0.3` ([#4007](https://github.com/MetaMask/core/pull/4007))
- Bump `@metamask/message-manager` to `^7.3.9` ([#4007](https://github.com/MetaMask/core/pull/4007))
- Bump `@metamask/rpc-errors` to `^6.2.1` ([#3954](https://github.com/MetaMask/core/pull/3954))
- Remove dependency `ethereumjs-util` ([#3943](https://github.com/MetaMask/core/pull/3943))

## [12.0.0]

### Changed

- **BREAKING:** Bump `@metamask/approval-controller` peer dependency to `^5.1.2` ([#3821](https://github.com/MetaMask/core/pull/3821))
- **BREAKING:** Bump `@metamask/keyring-controller` peer dependency to `^12.2.0` ([#3821](https://github.com/MetaMask/core/pull/3821))
- **BREAKING:** Bump `@metamask/logging-controller` peer dependency to `^2.0.2` ([#3821](https://github.com/MetaMask/core/pull/3821))
- Bump `@metamask/base-controller` to `^4.1.1` ([#3821](https://github.com/MetaMask/core/pull/3821))
- Bump `@metamask/controller-utils` to `^8.0.2` ([#3821](https://github.com/MetaMask/core/pull/3821))
- Bump `@metamask/message-manager` to `^7.3.8` ([#3821](https://github.com/MetaMask/core/pull/3821))

## [11.0.0]

### Changed

- **BREAKING:** Bump `@metamask/keyring-controller` to ^12.1.0
- Bump `@metamask/utils` to `^8.3.0` ([#3769](https://github.com/MetaMask/core/pull/3769))

### Fixed

- Fix `stateChange` subscriptions with selectors ([#3702](https://github.com/MetaMask/core/pull/3702))

## [10.0.0]

### Changed

- **BREAKING:** Bump `@metamask/keyring-controller` to ^12.0.0

## [9.0.0]

### Changed

- **BREAKING:** Bump `@metamask/approval-controller` dependency and peer dependency from `^5.0.0` to `^5.1.1` ([#3695](https://github.com/MetaMask/core/pull/3695), [#3680](https://github.com/MetaMask/core/pull/3680))
- **BREAKING:** Bump `@metamask/keyring-controller` dependency and peer dependency from `^10.0.0` to `^11.0.0` ([#3695](https://github.com/MetaMask/core/pull/3695))
- **BREAKING:** Bump `@metamask/logging-controller` dependency and peer dependency from `^2.0.0` to `^2.0.1` ([#3695](https://github.com/MetaMask/core/pull/3695))
- Bump `@metamask/base-controller` to `^4.0.1` ([#3695](https://github.com/MetaMask/core/pull/3695))
- Bump `@metamask/controller-utils` to `^8.0.1` ([#3695](https://github.com/MetaMask/core/pull/3695), [#3678](https://github.com/MetaMask/core/pull/3678), [#3667](https://github.com/MetaMask/core/pull/3667), [#3580](https://github.com/MetaMask/core/pull/3580))
- Bump `@metamask/message-manager` to `^7.3.7` ([#3695](https://github.com/MetaMask/core/pull/3695))

## [8.0.0]

### Changed

- **BREAKING:** Bump `@metamask/base-controller` to ^4.0.0 ([#2063](https://github.com/MetaMask/core/pull/2063))
  - This is breaking because the type of the `messenger` has backward-incompatible changes. See the changelog for this package for more.
- Bump `@metamask/approval-controller` to ^5.0.0 ([#2063](https://github.com/MetaMask/core/pull/2063))
- Bump `@metamask/controller-utils` to ^6.0.0 ([#2063](https://github.com/MetaMask/core/pull/2063))
- Bump `@metamask/keyring-controller` to ^10.0.0 ([#2063](https://github.com/MetaMask/core/pull/2063))
- Bump `@metamask/logging-controller` to ^2.0.0 ([#2063](https://github.com/MetaMask/core/pull/2063))
- Bump `@metamask/message-manager` to ^7.3.6 ([#2063](https://github.com/MetaMask/core/pull/2063))

## [7.0.0]

### Changed

- **BREAKING**: Add `@metamask/keyring-controller` as a dependency and peer dependency
  - This was relied upon by past versions, but this was not reflected in the package manifest until now
- Bump @metamask/utils from 8.1.0 to 8.2.0 ([#1957](https://github.com/MetaMask/core/pull/1957))

## [6.1.3]

### Changed

- Move from `eth-rpc-errors` ^4.0.2 to `@metamask/rpc-errors` ^6.1.0 ([#1653](https://github.com/MetaMask/core/pull/1653))
- Bump dependency and peer dependency on `@metamask/approval-controller` to ^4.0.1
- Bump dependency and peer dependency on `@metamask/logging-controller` to ^1.0.4

## [6.1.2]

### Changed

- Bump dependency on `@metamask/utils` to ^8.1.0 ([#1639](https://github.com/MetaMask/core/pull/1639))
- Bump dependency and peer dependency on `@metamask/approval-controller` to ^4.0.0
- Bump dependency on `@metamask/base-controller` to ^3.2.3
- Bump dependency on `@metamask/controller-utils` to 5.0.2
- Bump dependency on `@metamask/message-manager` to ^7.3.5

## [6.1.1]

### Changed

- Update TypeScript to v4.8.x ([#1718](https://github.com/MetaMask/core/pull/1718))

## [6.1.0]

### Changed

- Add `LoggingController` logs on signature operation stages ([#1692](https://github.com/MetaMask/core/pull/1692))
- Bump dependency on `@metamask/controller-utils` to ^5.0.0
- Bump dependency on `@metamask/keyring-controller` to ^8.0.0
- Bump dependency on `@metamask/logging-controller` to ^1.0.2
- Bump dependency on `@metamask/message-manager` to ^7.3.3

## [6.0.0]

### Changed

- **BREAKING**: Removed `keyringController` property from constructor option ([#1593](https://github.com/MetaMask/core/pull/1593))

## [5.3.1]

### Changed

- Bump dependency and peer dependency on `@metamask/approval-controller` to ^3.5.1
- Bump dependency on `@metamask/base-controller` to ^3.2.1
- Bump dependency on `@metamask/controller-utils` to ^4.3.2
- Bump dependency on `@metamask/message-manager` to ^7.3.1

## [5.3.0]

### Added

- Add new methods `setDeferredSignSuccess` and `setDeferredSignError` ([#1506](https://github.com/MetaMask/core/pull/1506))

### Changed

- Update `@metamask/utils` to `^6.2.0` ([#1514](https://github.com/MetaMask/core/pull/1514))

## [5.2.0]

### Added

- Add `messages` getter that returns all messages ([#1469](https://github.com/MetaMask/core/pull/1469))
- Add `setMessageMetadata` method for customizing the metadata for an individual message ([#1469](https://github.com/MetaMask/core/pull/1469))

## [5.1.0]

### Changed

- Report approval success using result callbacks ([#1458](https://github.com/MetaMask/core/pull/1458))

## [5.0.0]

### Added

- **BREAKING** Add sign version to approval message in Signature Controller ([#1440](https://github.com/MetaMask/core/pull/1440))
  - Method `newUnsignedTypedMessage` on the SignatureController now requires a fourth argument: `signingOpts`
  - Method `signMessage` on the SignatureController no longer expects a `version` as a second argument. The second argument is now `signingOpts` which was previously the third argument.

## [4.0.1]

### Fixed

- Remove optional parameter from newUnsignedTypedMessage function ([#1436](https://github.com/MetaMask/core/pull/1436))

## [4.0.0]

### Changed

- **BREAKING:** `newUnsignedXMessage` middlewares now creates and awaits approvals itself. ([#1377](https://github.com/MetaMask/core/pull/1377))

### Removed

- **BREAKING:** Removed `cancelXMessage` and `signXMessage` from public API. ([#1377](https://github.com/MetaMask/core/pull/1377))

## [3.0.0]

### Added

- Add support for deferred signing ([#1364](https://github.com/MetaMask/core/pull/1364))
  - If the parameter `deferSetAsSigned` is set, the message won't be set as signed when the keyring is asked to sign it
- Emit the event `${methodName}:signed` when the keying is asked to sign a message ([#1364](https://github.com/MetaMask/core/pull/1364))
- Add methods `setTypedMessageInProgress` and `setPersonalMessageInProgress` to set a message status to `inProgress` ([#1339](https://github.com/MetaMask/core/pull/1339))

### Changed

- **BREAKING:** The constructor option `getCurrentChainId` now expects a `Hex` return value rather than `string` ([#1367](https://github.com/MetaMask/core/pull/1367))
- **BREAKING:** Update `@metamask/approval-controller` dependency and add it as a peer dependency ([#1393](https://github.com/MetaMask/core/pull/1393))
- Add `@metamask/utils` dependency ([#1367](https://github.com/MetaMask/core/pull/1367))

## [2.0.0]

### Added

- **BREAKING:** Add `getCurrentChainId` argument to constructor ([#1350](https://github.com/MetaMask/core/pull/1350))

## [1.0.0]

### Added

- Initial release ([#1214](https://github.com/MetaMask/core/pull/1214))

[Unreleased]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@32.0.0...HEAD
[32.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@31.0.1...@metamask/signature-controller@32.0.0
[31.0.1]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@31.0.0...@metamask/signature-controller@31.0.1
[31.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@30.0.0...@metamask/signature-controller@31.0.0
[30.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@29.0.0...@metamask/signature-controller@30.0.0
[29.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@28.0.0...@metamask/signature-controller@29.0.0
[28.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@27.1.0...@metamask/signature-controller@28.0.0
[27.1.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@27.0.0...@metamask/signature-controller@27.1.0
[27.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@26.0.0...@metamask/signature-controller@27.0.0
[26.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@25.0.0...@metamask/signature-controller@26.0.0
[25.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@24.0.0...@metamask/signature-controller@25.0.0
[24.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@23.2.1...@metamask/signature-controller@24.0.0
[23.2.1]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@23.2.0...@metamask/signature-controller@23.2.1
[23.2.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@23.1.0...@metamask/signature-controller@23.2.0
[23.1.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@23.0.1...@metamask/signature-controller@23.1.0
[23.0.1]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@23.0.0...@metamask/signature-controller@23.0.1
[23.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@22.0.0...@metamask/signature-controller@23.0.0
[22.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@21.1.0...@metamask/signature-controller@22.0.0
[21.1.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@21.0.0...@metamask/signature-controller@21.1.0
[21.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@20.1.0...@metamask/signature-controller@21.0.0
[20.1.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@20.0.0...@metamask/signature-controller@20.1.0
[20.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@19.1.0...@metamask/signature-controller@20.0.0
[19.1.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@19.0.0...@metamask/signature-controller@19.1.0
[19.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@18.1.0...@metamask/signature-controller@19.0.0
[18.1.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@18.0.1...@metamask/signature-controller@18.1.0
[18.0.1]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@18.0.0...@metamask/signature-controller@18.0.1
[18.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@17.0.0...@metamask/signature-controller@18.0.0
[17.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@16.0.0...@metamask/signature-controller@17.0.0
[16.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@15.0.0...@metamask/signature-controller@16.0.0
[15.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@14.0.1...@metamask/signature-controller@15.0.0
[14.0.1]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@14.0.0...@metamask/signature-controller@14.0.1
[14.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@13.0.0...@metamask/signature-controller@14.0.0
[13.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@12.0.0...@metamask/signature-controller@13.0.0
[12.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@11.0.0...@metamask/signature-controller@12.0.0
[11.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@10.0.0...@metamask/signature-controller@11.0.0
[10.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@9.0.0...@metamask/signature-controller@10.0.0
[9.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@8.0.0...@metamask/signature-controller@9.0.0
[8.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@7.0.0...@metamask/signature-controller@8.0.0
[7.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@6.1.3...@metamask/signature-controller@7.0.0
[6.1.3]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@6.1.2...@metamask/signature-controller@6.1.3
[6.1.2]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@6.1.1...@metamask/signature-controller@6.1.2
[6.1.1]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@6.1.0...@metamask/signature-controller@6.1.1
[6.1.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@6.0.0...@metamask/signature-controller@6.1.0
[6.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@5.3.1...@metamask/signature-controller@6.0.0
[5.3.1]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@5.3.0...@metamask/signature-controller@5.3.1
[5.3.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@5.2.0...@metamask/signature-controller@5.3.0
[5.2.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@5.1.0...@metamask/signature-controller@5.2.0
[5.1.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@5.0.0...@metamask/signature-controller@5.1.0
[5.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@4.0.1...@metamask/signature-controller@5.0.0
[4.0.1]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@4.0.0...@metamask/signature-controller@4.0.1
[4.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@3.0.0...@metamask/signature-controller@4.0.0
[3.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@2.0.0...@metamask/signature-controller@3.0.0
[2.0.0]: https://github.com/MetaMask/core/compare/@metamask/signature-controller@1.0.0...@metamask/signature-controller@2.0.0
[1.0.0]: https://github.com/MetaMask/core/releases/tag/@metamask/signature-controller@1.0.0

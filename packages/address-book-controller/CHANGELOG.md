# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [6.1.1]

### Changed

- Bump `@metamask/utils` from `^11.2.0` to `^11.4.2` ([#6054](https://github.com/MetaMask/core/pull/6054))
- Bump `@metamask/controller-utils` to `^11.11.0` ([#5935](https://github.com/MetaMask/core/pull/5935), [#6069](https://github.com/MetaMask/core/pull/6069))
  - This upgrade includes performance improvements to checksum hex address normalization

## [6.1.0]

### Added

- Add contact event system ([#5779](https://github.com/MetaMask/core/pull/5779))
  - Add `AddressBookControllerContactUpdatedEvent` and `AddressBookControllerContactDeletedEvent` types for contact events
  - Add `list` method on `AddressBookController` to get all address book entries as an array
  - Register message handlers for `list`, `set`, and `delete` actions
  - Add optional `lastUpdatedAt` property to `AddressBookEntry` to track when contacts were last modified

### Changed

- Bump `@metamask/base-controller` from ^8.0.0 to ^8.0.1 ([#5722](https://github.com/MetaMask/core/pull/5722))
- Bump `@metamask/controller-utils` to `^11.9.0` ([#5583](https://github.com/MetaMask/core/pull/5583), [#5765](https://github.com/MetaMask/core/pull/5765), [#5812](https://github.com/MetaMask/core/pull/5812))

### Fixed

- Fix `delete` method to clean up empty chainId objects when the last address in a chain is deleted ([#5779](https://github.com/MetaMask/core/pull/5779))

## [6.0.3]

### Changed

- Bump `@metamask/base-controller` from `^7.0.2` to `^8.0.0` ([#5079](https://github.com/MetaMask/core/pull/5079)), ([#5135](https://github.com/MetaMask/core/pull/5135)), ([#5305](https://github.com/MetaMask/core/pull/5305))
- Bump `@metamask/controller-utils` from `^11.4.4` to `^11.5.0` ([#5135](https://github.com/MetaMask/core/pull/5135)), ([#5272](https://github.com/MetaMask/core/pull/5272))
- Bump `@metamask/rpc-errors` from `^7.0.1` to `^7.0.2` ([#5080](https://github.com/MetaMask/core/pull/5080))
- Bump `@metamask/utils` from `^10.0.0` to `^11.1.0` ([#5080](https://github.com/MetaMask/core/pull/5080)), ([#5223](https://github.com/MetaMask/core/pull/5223))

## [6.0.2]

### Changed

- Bump `@metamask/utils` from `^9.1.0` to `^10.0.0` ([#4831](https://github.com/MetaMask/core/pull/4831))
- Bump `@metamask/base-controller` from `^7.0.1` to `^7.0.2` ([#4862](https://github.com/MetaMask/core/pull/4862))
- Bump `@metamask/controller-utils` from `^11.3.0` to `^11.4.4` ([#4834](https://github.com/MetaMask/core/pull/4834), [#4862](https://github.com/MetaMask/core/pull/4862), [#4870](https://github.com/MetaMask/core/pull/4870), [#4915](https://github.com/MetaMask/core/pull/4915), [#5012](https://github.com/MetaMask/core/pull/5012))

## [6.0.1]

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

## [6.0.0]

### Added

- Add `AddressBookController` messenger types: `AddressBookControllerMessenger`, `AddressBookControllerGetStateAction`, `AddressBookControllerActions`, `AddressBookControllerStateChangeEvent`, `AddressBookControllerEvents` ([#4392](https://github.com/MetaMask/core/pull/4392))
- Add `getDefaultAddressBookControllerState` getter for the default state of `AddressBookController` ([#4392](https://github.com/MetaMask/core/pull/4392))

### Changed

- **BREAKING:** `AddressBookController` inherits from `BaseController`, not `BaseControllerV1` ([#4392](https://github.com/MetaMask/core/pull/4392))
- **BREAKING:** Add `messenger` as required constructor option to `AddressBookController` ([#4392](https://github.com/MetaMask/core/pull/4392))
- **BREAKING:** Rename `AddressBookState` type to `AddressBookControllerState` ([#4392](https://github.com/MetaMask/core/pull/4392))
- Bump `@metamask/base-controller` from `^6.0.0` to `^7.0.0` ([#4517](https://github.com/MetaMask/core/pull/4517), [#4544](https://github.com/MetaMask/core/pull/4544), [#4625](https://github.com/MetaMask/core/pull/4625), [#4643](https://github.com/MetaMask/core/pull/4643))
- Bump `@metamask/controller-utils` from `^11.0.0` to `^11.2.0` ([#4517](https://github.com/MetaMask/core/pull/4517), [#4544](https://github.com/MetaMask/core/pull/4544), [#4639](https://github.com/MetaMask/core/pull/4639), [#4651](https://github.com/MetaMask/core/pull/4651))
- Bump `@metamask/utils` from `^8.3.0` to `^9.1.0` ([#4516](https://github.com/MetaMask/core/pull/4516), [#4529](https://github.com/MetaMask/core/pull/4529))
- Bump `typescript` from `~4.9.5` to `~5.2.2` and set `module{,Resolution}` options to `Node16` ([#3645](https://github.com/MetaMask/core/pull/3645), [#4576](https://github.com/MetaMask/core/pull/4576), [#4584](https://github.com/MetaMask/core/pull/4584))

### Removed

- **BREAKING:** Remove `config` from required constructor options of `AddressBookController` ([#4392](https://github.com/MetaMask/core/pull/4392))
- **BREAKING:** Remove `AddressBookConfig` type ([#4392](https://github.com/MetaMask/core/pull/4392))

## [5.0.0]

### Changed

- **BREAKING:** Bump minimum Node version to 18.18 ([#3611](https://github.com/MetaMask/core/pull/3611))
- Bump `@metamask/base-controller` to `^6.0.0` ([#4352](https://github.com/MetaMask/core/pull/4352))
- Bump `@metamask/controller-utils` to `^11.0.0` ([#4352](https://github.com/MetaMask/core/pull/4352))

## [4.0.2]

### Changed

- Bump `@metamask/base-controller` to `^5.0.2` ([#4232](https://github.com/MetaMask/core/pull/4232))
- Bump `@metamask/controller-utils` to `^10.0.0` ([#4342](https://github.com/MetaMask/core/pull/4342))

### Fixed

- Fix `delete` method to protect against prototype-polluting assignments ([#4041](https://github.com/MetaMask/core/pull/4041))

## [4.0.1]

### Fixed

- Fix `types` field in `package.json` ([#4047](https://github.com/MetaMask/core/pull/4047))

## [4.0.0]

### Added

- **BREAKING**: Add ESM build ([#3998](https://github.com/MetaMask/core/pull/3998))
  - It's no longer possible to import files from `./dist` directly.

### Changed

- **BREAKING:** Bump `@metamask/base-controller` to `^5.0.0` ([#4039](https://github.com/MetaMask/core/pull/4039))
  - This version has a number of breaking changes. See the changelog for more.
- Bump `@metamask/controller-utils` to `^9.0.0` ([#4039](https://github.com/MetaMask/core/pull/4039))

## [3.1.7]

### Changed

- Bump `@metamask/utils` to `^8.3.0` ([#3769](https://github.com/MetaMask/core/pull/3769))
- Bump `@metamask/base-controller` to `^4.1.1` ([#3760](https://github.com/MetaMask/core/pull/3760), [#3821](https://github.com/MetaMask/core/pull/3821))
- Bump `@metamask/controller-utils` to `^8.0.2` ([#3821](https://github.com/MetaMask/core/pull/3821))

## [3.1.6]

### Changed

- Bump `@metamask/base-controller` to `^4.0.1` ([#3695](https://github.com/MetaMask/core/pull/3695))
- Bump `@metamask/controller-utils` to `^8.0.1` ([#3695](https://github.com/MetaMask/core/pull/3695), [#3678](https://github.com/MetaMask/core/pull/3678), [#3667](https://github.com/MetaMask/core/pull/3667), [#3580](https://github.com/MetaMask/core/pull/3580))

## [3.1.5]

### Changed

- Bump `@metamask/utils` to ^8.2.0 ([#1957](https://github.com/MetaMask/core/pull/1957))
- Bump `@metamask/base-controller` to ^4.0.0 ([#2063](https://github.com/MetaMask/core/pull/2063))
  - This is not a breaking change because this controller still inherits from BaseController v1.
- Bump `@metamask/controller-utils` to ^6.0.0 ([#2063](https://github.com/MetaMask/core/pull/2063))

## [3.1.4]

### Changed

- Bump dependency on `@metamask/utils` to ^8.1.0 ([#1639](https://github.com/MetaMask/core/pull/1639))
- Bump dependency on `@metamask/base-controller` to ^3.2.3
- Bump dependency on `@metamask/controller-utils` to ^5.0.2

## [3.1.3]

### Changed

- Update TypeScript to v4.8.x ([#1718](https://github.com/MetaMask/core/pull/1718))

## [3.1.2]

### Changed

- Bump dependency on `@metamask/controller-utils` to ^5.0.0

## [3.1.1]

### Changed

- Bump dependency on `@metamask/base-controller` to ^3.2.1
- Bump dependency on `@metamask/controller-utils` to ^4.3.2

## [3.1.0]

### Changed

- Update `@metamask/utils` to `^6.2.0` ([#1514](https://github.com/MetaMask/core/pull/1514))

## [3.0.0]

### Changed

- **BREAKING:**: Bump to Node 16 ([#1262](https://github.com/MetaMask/core/pull/1262))
- **BREAKING:** The `addressBook` state property is now keyed by `Hex` chain ID rather than `string`, and the `chainId` property of each address book entry is also `Hex` rather than `string`.
  - This requires a state migration ([#1367](https://github.com/MetaMask/core/pull/1367))
- **BREAKING:** The methods `delete` and `set` now except the chain ID as `Hex` rather than as a decimal string ([#1367](https://github.com/MetaMask/core/pull/1367))
- Add `@metamask/utils` dependency ([#1367](https://github.com/MetaMask/core/pull/1367))

## [2.0.0]

### Removed

- **BREAKING:** Remove `isomorphic-fetch` ([#1106](https://github.com/MetaMask/controllers/pull/1106))
  - Consumers must now import `isomorphic-fetch` or another polyfill themselves if they are running in an environment without `fetch`

## [1.1.0]

### Changed

- Add optional `addressType` property to address book entries ([#828](https://github.com/MetaMask/controllers/pull/828), [#1068](https://github.com/MetaMask/core/pull/1068))
- Rename this repository to `core` ([#1031](https://github.com/MetaMask/controllers/pull/1031))
- Update `@metamask/controller-utils` package ([#1041](https://github.com/MetaMask/controllers/pull/1041))

## [1.0.1]

### Changed

- Relax dependencies on `@metamask/base-controller` and `@metamask/controller-utils` (use `^` instead of `~`) ([#998](https://github.com/MetaMask/core/pull/998))

## [1.0.0]

### Added

- Initial release

  - As a result of converting our shared controllers repo into a monorepo ([#831](https://github.com/MetaMask/core/pull/831)), we've created this package from select parts of [`@metamask/controllers` v33.0.0](https://github.com/MetaMask/core/tree/v33.0.0), namely:

    - `src/user/AddressBookController.ts`
    - `src/user/AddressBookController.test.ts`

    All changes listed after this point were applied to this package following the monorepo conversion.

[Unreleased]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@6.1.1...HEAD
[6.1.1]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@6.1.0...@metamask/address-book-controller@6.1.1
[6.1.0]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@6.0.3...@metamask/address-book-controller@6.1.0
[6.0.3]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@6.0.2...@metamask/address-book-controller@6.0.3
[6.0.2]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@6.0.1...@metamask/address-book-controller@6.0.2
[6.0.1]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@6.0.0...@metamask/address-book-controller@6.0.1
[6.0.0]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@5.0.0...@metamask/address-book-controller@6.0.0
[5.0.0]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@4.0.2...@metamask/address-book-controller@5.0.0
[4.0.2]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@4.0.1...@metamask/address-book-controller@4.0.2
[4.0.1]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@4.0.0...@metamask/address-book-controller@4.0.1
[4.0.0]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@3.1.7...@metamask/address-book-controller@4.0.0
[3.1.7]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@3.1.6...@metamask/address-book-controller@3.1.7
[3.1.6]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@3.1.5...@metamask/address-book-controller@3.1.6
[3.1.5]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@3.1.4...@metamask/address-book-controller@3.1.5
[3.1.4]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@3.1.3...@metamask/address-book-controller@3.1.4
[3.1.3]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@3.1.2...@metamask/address-book-controller@3.1.3
[3.1.2]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@3.1.1...@metamask/address-book-controller@3.1.2
[3.1.1]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@3.1.0...@metamask/address-book-controller@3.1.1
[3.1.0]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@3.0.0...@metamask/address-book-controller@3.1.0
[3.0.0]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@2.0.0...@metamask/address-book-controller@3.0.0
[2.0.0]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@1.1.0...@metamask/address-book-controller@2.0.0
[1.1.0]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@1.0.1...@metamask/address-book-controller@1.1.0
[1.0.1]: https://github.com/MetaMask/core/compare/@metamask/address-book-controller@1.0.0...@metamask/address-book-controller@1.0.1
[1.0.0]: https://github.com/MetaMask/core/releases/tag/@metamask/address-book-controller@1.0.0

import type { Eip1193Provider } from 'ethers';

import { SIWEJwtBearerAuth } from './authentication-jwt-bearer/flow-siwe';
import { SRPJwtBearerAuth } from './authentication-jwt-bearer/flow-srp';
import {
  getNonce,
  pairIdentifiers,
} from './authentication-jwt-bearer/services';
import type {
  UserProfile,
  Pair,
  UserProfileLineage,
} from './authentication-jwt-bearer/types';
import { AuthType } from './authentication-jwt-bearer/types';
import { PairError, UnsupportedAuthTypeError } from './errors';
import type { Env } from '../shared/env';

// Computing the Classes, so we only get back the public methods for the interface.

type Compute<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;
type SIWEInterface = Compute<SIWEJwtBearerAuth>;
export type SRPInterface = Compute<SRPJwtBearerAuth>;

type SiweParams = ConstructorParameters<typeof SIWEJwtBearerAuth>;
type SRPParams = ConstructorParameters<typeof SRPJwtBearerAuth>;
type JwtBearerAuthParams = SiweParams | SRPParams;

export class JwtBearerAuth implements SIWEInterface, SRPInterface {
  readonly #type: AuthType;

  readonly #env: Env;

  readonly #sdk: SIWEJwtBearerAuth | SRPJwtBearerAuth;

  constructor(...args: JwtBearerAuthParams) {
    this.#type = args[0].type;
    this.#env = args[0].env;

    if (args[0].type === AuthType.SRP) {
      this.#sdk = new SRPJwtBearerAuth(args[0], args[1]);
      return;
    }

    if (args[0].type === AuthType.SiWE) {
      this.#sdk = new SIWEJwtBearerAuth(args[0], args[1]);
      return;
    }

    throw new UnsupportedAuthTypeError('unsupported auth type');
  }

  setCustomProvider(provider: Eip1193Provider) {
    this.#assertSRP(this.#type, this.#sdk);
    this.#sdk.setCustomProvider(provider);
  }

  async getAccessToken(entropySourceId?: string): Promise<string> {
    return await this.#sdk.getAccessToken(entropySourceId);
  }

  async connectSnap(): Promise<string> {
    this.#assertSRP(this.#type, this.#sdk);
    return this.#sdk.connectSnap();
  }

  async isSnapConnected(): Promise<boolean> {
    this.#assertSRP(this.#type, this.#sdk);
    return this.#sdk.isSnapConnected();
  }

  async getUserProfile(entropySourceId?: string): Promise<UserProfile> {
    return await this.#sdk.getUserProfile(entropySourceId);
  }

  async getIdentifier(entropySourceId?: string): Promise<string> {
    return await this.#sdk.getIdentifier(entropySourceId);
  }

  async getUserProfileLineage(): Promise<UserProfileLineage> {
    return await this.#sdk.getUserProfileLineage();
  }

  async signMessage(
    message: string,
    entropySourceId?: string,
  ): Promise<string> {
    return await this.#sdk.signMessage(message, entropySourceId);
  }

  async pairIdentifiers(pairing: Pair[]): Promise<void> {
    const profile = await this.getUserProfile();
    const n = await getNonce(profile.profileId, this.#env);

    const logins = await Promise.all(
      pairing.map(async (p) => {
        try {
          const raw = `metamask:${n.nonce}:${p.identifier}`;
          const sig = await p.signMessage(raw);
          return {
            signature: sig,
            raw_message: raw,
            encrypted_storage_key: p.encryptedStorageKey,
            identifier_type: p.identifierType,
          };
        } catch (e) {
          /* istanbul ignore next */
          const errorMessage =
            e instanceof Error ? e.message : JSON.stringify(e ?? '');
          throw new PairError(
            `failed to sign pairing message: ${errorMessage}`,
          );
        }
      }),
    );

    const accessToken = await this.getAccessToken();
    await pairIdentifiers(n.nonce, logins, accessToken, this.#env);
  }

  prepare(signer: {
    address: string;
    chainId: number;
    signMessage: (message: string) => Promise<string>;
    domain: string;
  }): void {
    this.#assertSIWE(this.#type, this.#sdk);
    this.#sdk.prepare(signer);
  }

  #assertSIWE(
    type: AuthType,
    _sdk: SIWEJwtBearerAuth | SRPJwtBearerAuth,
  ): asserts _sdk is SIWEJwtBearerAuth {
    if (type === AuthType.SiWE) {
      return;
    }

    throw new UnsupportedAuthTypeError(
      'This method is only available via SIWE auth type',
    );
  }

  #assertSRP(
    type: AuthType,
    _sdk: SIWEJwtBearerAuth | SRPJwtBearerAuth,
  ): asserts _sdk is SRPJwtBearerAuth {
    if (type === AuthType.SRP) {
      return;
    }

    throw new UnsupportedAuthTypeError(
      'This method is only available via SRP auth type',
    );
  }
}

export { SIWEJwtBearerAuth } from './authentication-jwt-bearer/flow-siwe';
export { SRPJwtBearerAuth } from './authentication-jwt-bearer/flow-srp';
export * from './authentication-jwt-bearer/types';

import { SiweMessage } from 'siwe';

import {
  SIWE_LOGIN_URL,
  authenticate,
  authorizeOIDC,
  getNonce,
  getUserProfileLineage,
} from './services';
import type {
  AuthConfig,
  AuthStorageOptions,
  AuthType,
  IBaseAuth,
  LoginResponse,
  UserProfile,
  UserProfileLineage,
} from './types';
import { ValidationError } from '../errors';
import { validateLoginResponse } from '../utils/validate-login-response';

type JwtBearerAuth_SIWE_Options = {
  storage: AuthStorageOptions;
};

type JwtBearerAuth_SIWE_Signer = {
  address: string;
  chainId: number;
  signMessage: (message: string) => Promise<string>;
  domain: string;
};

export class SIWEJwtBearerAuth implements IBaseAuth {
  readonly #config: AuthConfig;

  readonly #options: JwtBearerAuth_SIWE_Options;

  #signer: JwtBearerAuth_SIWE_Signer | undefined;

  constructor(
    config: AuthConfig & { type: AuthType.SiWE },
    options: JwtBearerAuth_SIWE_Options,
  ) {
    this.#config = config;
    this.#options = options;
  }

  async getAccessToken(): Promise<string> {
    const session = await this.#getAuthSession();
    if (session) {
      return session.token.accessToken;
    }

    const loginResponse = await this.#login();
    return loginResponse.token.accessToken;
  }

  async getUserProfile(): Promise<UserProfile> {
    const session = await this.#getAuthSession();
    if (session) {
      return session.profile;
    }

    const loginResponse = await this.#login();
    return loginResponse.profile;
  }

  async getIdentifier(): Promise<string> {
    this.#assertSigner(this.#signer);
    return this.#signer.address;
  }

  async getUserProfileLineage(): Promise<UserProfileLineage> {
    const accessToken = await this.getAccessToken();
    return await getUserProfileLineage(this.#config.env, accessToken);
  }

  async signMessage(message: string): Promise<string> {
    this.#assertSigner(this.#signer);
    return await this.#signer.signMessage(message);
  }

  prepare(signer: JwtBearerAuth_SIWE_Signer) {
    this.#signer = signer;
  }

  // convert expiresIn from seconds to milliseconds and use 90% of expiresIn
  async #getAuthSession(): Promise<LoginResponse | null> {
    const auth = await this.#options.storage.getLoginResponse();
    if (!validateLoginResponse(auth)) {
      return null;
    }

    const currentTime = Date.now();
    const sessionAge = currentTime - auth.token.obtainedAt;
    const refreshThreshold = auth.token.expiresIn * 1000 * 0.9;

    if (sessionAge < refreshThreshold) {
      return auth;
    }
    return null;
  }

  async #login(): Promise<LoginResponse> {
    this.#assertSigner(this.#signer);

    // Nonce
    const address = await this.getIdentifier();
    const nonceRes = await getNonce(address, this.#config.env);
    const rawMessage = this.#createSiWELoginRawMessage(nonceRes.nonce);
    const signature = await this.signMessage(rawMessage);

    // Authenticate
    const authResponse = await authenticate(
      rawMessage,
      signature,
      this.#config.type,
      this.#config.env,
    );

    // Authorize
    const tokenResponse = await authorizeOIDC(
      authResponse.token,
      this.#config.env,
      this.#config.platform,
    );

    // Save
    const result: LoginResponse = {
      profile: authResponse.profile,
      token: tokenResponse,
    };

    await this.#options.storage.setLoginResponse(result);

    return result;
  }

  #createSiWELoginRawMessage(nonce: string): string {
    this.#assertSigner(this.#signer);

    return new SiweMessage({
      domain: this.#signer?.domain,
      address: this.#signer?.address,
      uri: SIWE_LOGIN_URL(this.#config.env),
      version: '1',
      chainId: this.#signer?.chainId,
      nonce,
      issuedAt: new Date().toISOString(),
    }).prepareMessage();
  }

  #assertSigner(
    signer?: JwtBearerAuth_SIWE_Signer,
  ): asserts signer is JwtBearerAuth_SIWE_Signer {
    if (!signer) {
      throw new ValidationError(`you must call 'prepare()' before logging in`);
    }
  }
}

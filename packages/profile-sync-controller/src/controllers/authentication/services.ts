import log from 'loglevel';

import { Env, Platform, getEnvUrls, getOidcClientId } from '../../shared/env';

const ENV_URLS = getEnvUrls(Env.PRD);

const AUTH_ENDPOINT: string = ENV_URLS.authApiUrl;
export const AUTH_NONCE_ENDPOINT = `${AUTH_ENDPOINT}/api/v2/nonce`;
export const AUTH_LOGIN_ENDPOINT = `${AUTH_ENDPOINT}/api/v2/srp/login`;

const OIDC_ENDPOINT: string = ENV_URLS.oidcApiUrl || '';
export const OIDC_TOKENS_ENDPOINT = `${OIDC_ENDPOINT}/oauth2/token`;
const OIDC_CLIENT_ID = (platform: 'mobile' | 'extension') => {
  if (platform === 'extension') {
    return getOidcClientId(Env.PRD, Platform.EXTENSION);
  }
  if (platform === 'mobile') {
    return getOidcClientId(Env.PRD, Platform.MOBILE);
  }

  throw new Error(`Unsupported platform - ${platform as string}`);
};
const OIDC_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:jwt-bearer';

export type NonceResponse = {
  nonce: string;
};

/**
 * Auth Service - Get Nonce. Used for the initial JWTBearer flow
 *
 * @param publicKey - public key to associate a nonce with
 * @returns the nonce or null if failed
 */
export async function getNonce(publicKey: string): Promise<string | null> {
  const nonceUrl = new URL(AUTH_NONCE_ENDPOINT);
  nonceUrl.searchParams.set('identifier', publicKey);

  try {
    const nonceResponse = await fetch(nonceUrl.toString());
    if (!nonceResponse.ok) {
      log.error(
        `authentication-controller/services: unable to get nonce - HTTP ${nonceResponse.status}`,
      );
      return null;
    }

    const nonceJson: NonceResponse = await nonceResponse.json();
    return nonceJson?.nonce ?? null;
  } catch (e) {
    log.error('authentication-controller/services: unable to get nonce', e);
    return null;
  }
}

/**
 * The Login API Server Response Shape
 */
export type LoginResponse = {
  token: string;

  expires_in: string;
  /**
   * Contains anonymous information about the logged in profile.
   *
   * identifier_id - a deterministic unique identifier on the method used to sign in
   *
   * profile_id - a unique id for a given profile
   *
   * metametrics_id - an anonymous server id
   */
  profile: {
    identifier_id: string;

    profile_id: string;
  };
};

type ClientMetaMetrics = {
  metametricsId: string;
  agent: 'extension' | 'mobile';
};

/**
 * Auth Service - Login. Will perform login with a given signature and will return a single use JWT Token.
 *
 * @param rawMessage - the original message before signing
 * @param signature - the signed message
 * @param clientMetaMetrics - optional client metametrics id (to associate on backend)
 * @returns The Login Response
 */
export async function login(
  rawMessage: string,
  signature: string,
  clientMetaMetrics: ClientMetaMetrics,
): Promise<LoginResponse | null> {
  try {
    const response = await fetch(AUTH_LOGIN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signature,

        raw_message: rawMessage,
        metametrics: {
          metametrics_id: clientMetaMetrics.metametricsId,
          agent: clientMetaMetrics.agent,
        },
      }),
    });

    if (!response.ok) {
      log.error(
        `authentication-controller/services: unable to login - HTTP ${response.status}`,
      );
      return null;
    }

    const loginResponse: LoginResponse = await response.json();
    return loginResponse ?? null;
  } catch (e) {
    log.error('authentication-controller/services: unable to login', e);
    return null;
  }
}

/**
 * The Auth API Token Response Shape
 */
export type OAuthTokenResponse = {
  access_token: string;

  expires_in: number;
};

/**
 * OIDC Service - Access Token. Trades the Auth Token for an access token (to be used for other authenticated endpoints)
 * NOTE - the access token is short lived, which means it is best practice to validate session before calling authenticated endpoints
 *
 * @param jwtToken - the JWT Auth Token, received from `/login`
 * @param platform - the OIDC platform to retrieve access token
 * @returns JWT Access token to store and use on authorized endpoints.
 */
export async function getAccessToken(
  jwtToken: string,
  platform: ClientMetaMetrics['agent'],
): Promise<string | null> {
  const headers = new Headers({
    'Content-Type': 'application/x-www-form-urlencoded',
  });

  const urlEncodedBody = new URLSearchParams();
  urlEncodedBody.append('grant_type', OIDC_GRANT_TYPE);
  urlEncodedBody.append('client_id', OIDC_CLIENT_ID(platform));
  urlEncodedBody.append('assertion', jwtToken);

  try {
    const response = await fetch(OIDC_TOKENS_ENDPOINT, {
      method: 'POST',
      headers,
      body: urlEncodedBody.toString(),
    });

    if (!response.ok) {
      log.error(
        `authentication-controller/services: unable to get access token - HTTP ${response.status}`,
      );
      return null;
    }

    const accessTokenResponse: OAuthTokenResponse = await response.json();
    return accessTokenResponse?.access_token ?? null;
  } catch (e) {
    log.error(
      'authentication-controller/services: unable to get access token',
      e,
    );
    return null;
  }
}

/**
 * Utility to create the raw login message for the JWT bearer flow (via SRP)
 *
 * @param nonce - nonce received from `/nonce` endpoint
 * @param publicKey - public key used to retrieve nonce and for message signing
 * @returns Raw Message which will be used for signing & logging in.
 */
export function createLoginRawMessage(
  nonce: string,
  publicKey: string,
): `metamask:${string}:${string}` {
  return `metamask:${nonce}:${publicKey}` as const;
}

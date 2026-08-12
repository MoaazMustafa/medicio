/**
 * Minimal module declaration for the `web-push` package (which ships no
 * bundled types). Keeping this local declaration means the project still
 * typechecks before `npm install` has pulled the dependency, and the runtime
 * import in `lib/notifications.ts` stays dynamic + guarded.
 */
declare module "web-push" {
  export interface WebPushSubscriptionKeys {
    p256dh: string;
    auth: string;
  }

  export interface WebPushSubscription {
    endpoint: string;
    expirationTime?: number | null;
    keys: WebPushSubscriptionKeys;
  }

  export interface RequestOptions {
    TTL?: number;
    urgency?: "very-low" | "low" | "normal" | "high";
    topic?: string;
    headers?: Record<string, string>;
  }

  export interface SendResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  export class WebPushError extends Error {
    statusCode: number;
    body: string;
    endpoint: string;
    headers: Record<string, string>;
  }

  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string,
  ): void;

  export function sendNotification(
    subscription: WebPushSubscription,
    payload?: string | Buffer | null,
    options?: RequestOptions,
  ): Promise<SendResult>;

  export function generateVAPIDKeys(): { publicKey: string; privateKey: string };

  const webPush: {
    setVapidDetails: typeof setVapidDetails;
    sendNotification: typeof sendNotification;
    generateVAPIDKeys: typeof generateVAPIDKeys;
    WebPushError: typeof WebPushError;
  };

  export default webPush;
}

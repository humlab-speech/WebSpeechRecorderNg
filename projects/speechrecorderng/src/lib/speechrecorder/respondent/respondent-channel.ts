import {SprRespondentSnapshot} from "./respondent-snapshot";

/**
 * The wire between the recorder window and the respondent window.
 *
 * Two transports carry the same envelopes: a `BroadcastChannel`, which also reaches a mirror the
 * recorder did not open (a tab dragged to the second screen), and `postMessage` to the window
 * handle, which still works when storage partitioning isolates a cross-site embedded recorder
 * from its popup. Both ends therefore accept either transport; duplicates are harmless because
 * every snapshot carries a sequence number and the mirror drops older ones.
 */
export interface SprRespondentEnvelope {
  type: 'hello' | 'snapshot' | 'bye';
  sessionId: string;
  /** Monotonic per recorder window; lets the mirror discard a late duplicate. */
  seq?: number;
  snapshot?: SprRespondentSnapshot;
}

/** Route of the mirror view, registered in `SPR_ROUTES` and therefore present in every consumer. */
export const RESPONDENT_ROUTE = 'spr/respondent';

/** Route with the session parameter, as it is registered. */
export const RESPONDENT_ROUTE_PATH = RESPONDENT_ROUTE + '/:id';

export function respondentChannelName(sessionId: string): string {
  return 'spr.respondent.' + sessionId;
}

/**
 * A stable window name per session, so a second key press reuses the open window instead of
 * opening another one.
 */
export function respondentWindowName(sessionId: string): string {
  return 'spr-respondent-' + sessionId;
}

/** Resolved against the application's base href, so a deployment under a sub path works. */
export function respondentMirrorUrl(sessionId: string): string {
  return new URL(RESPONDENT_ROUTE + '/' + encodeURIComponent(sessionId), document.baseURI).toString();
}

/**
 * Whether this window can mirror at all. `BroadcastChannel` is the primary transport; without it
 * the manually opened mirror cannot be reached, and the view says so instead of staying blank.
 * Every browser this application supports (Safari/iOS 16 and newer, Chrome/Edge 107, Firefox 104)
 * has it.
 */
export function respondentDisplaySupported(): boolean {
  return typeof BroadcastChannel !== 'undefined';
}

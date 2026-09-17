import {Injectable, OnDestroy} from "@angular/core";
import {SprRespondentSnapshot} from "./respondent-snapshot";
import {
  SprRespondentEnvelope,
  respondentChannelName,
  respondentDisplaySupported,
  respondentMirrorUrl,
  respondentWindowName,
} from "./respondent-channel";
import {SprLogger} from "../../utils/logger";

/** Outcome of a request to show the respondent window. */
export type SprRespondentOpenResult = 'opened' | 'focused' | 'blocked' | 'unsupported';

/**
 * Owns the respondent window and the wire to it.
 *
 * The recorder window publishes the stage whenever it changes; a mirror announces itself with
 * `hello` and is answered with the current stage, so a late, reloaded or manually opened mirror
 * needs no second code path. The recorder never reads state back: the mirror is output only.
 */
@Injectable()
export class RespondentDisplayService implements OnDestroy {

  private _snapshot: SprRespondentSnapshot | null = null;
  private _seq = 0;
  private _mirror: Window | null = null;
  private _channel: BroadcastChannel | null = null;
  private _channelSessionId: string | null = null;

  private readonly onChannelMessage = (event: MessageEvent) => this.receive(event.data);
  private readonly onWindowMessage = (event: MessageEvent) => {
    if (event.origin === location.origin) {
      this.receive(event.data);
    }
  };

  /* A page holding an open channel is kept out of the back/forward cache by some browsers, so the
     channel is closed while the page sits in the cache and reopened when it comes back. */
  private readonly onPageHide = () => this.closeChannel();
  private readonly onPageShow = () => {
    if (this._snapshot) {
      this.ensureChannel(this._snapshot.sessionId);
      this.sendSnapshot();
    }
  };

  constructor() {
    window.addEventListener('message', this.onWindowMessage);
    window.addEventListener('pagehide', this.onPageHide);
    window.addEventListener('pageshow', this.onPageShow);
  }

  /** The open mirror window, or `null` when there is none (also right after it was closed). */
  mirrorWindow(): Window | null {
    if (this._mirror && this._mirror.closed) {
      this._mirror = null;
    }
    return this._mirror;
  }

  /**
   * Shows the respondent window, or brings it to the front when it is already open.
   *
   * Must be called synchronously from a user gesture: the browser only allows a popup while a
   * transient activation is live, and the key handler is the natural place for that.
   */
  openOrFocus(sessionId: string): SprRespondentOpenResult {
    if (!respondentDisplaySupported()) {
      SprLogger.warn('Respondent display: this browser has no BroadcastChannel.');
      return 'unsupported';
    }
    this.ensureChannel(sessionId);
    const open = this.mirrorWindow();
    if (open) {
      open.focus();
      this.sendSnapshot();
      return 'focused';
    }
    const opened = window.open(respondentMirrorUrl(sessionId), respondentWindowName(sessionId));
    if (!opened) {
      SprLogger.warn('Respondent display: the browser blocked the window.');
      return 'blocked';
    }
    this._mirror = opened;
    opened.focus();
    return 'opened';
  }

  /** Hands the current stage to every mirror; called whenever the stage changes. */
  publish(snapshot: SprRespondentSnapshot): void {
    this._snapshot = snapshot;
    this._seq++;
    this.ensureChannel(snapshot.sessionId);
    this.sendSnapshot();
  }

  private sendSnapshot(): void {
    const snapshot = this._snapshot;
    if (!snapshot) {
      return;
    }
    this.send({type: 'snapshot', sessionId: snapshot.sessionId, seq: this._seq, snapshot});
  }

  private send(envelope: SprRespondentEnvelope): void {
    if (this._channel) {
      try {
        this._channel.postMessage(envelope);
      } catch (e) {
        SprLogger.warn('Respondent display: channel send failed.', e);
      }
    }
    const mirror = this.mirrorWindow();
    if (mirror) {
      try {
        mirror.postMessage(envelope, location.origin);
      } catch (e) {
        // The window can be gone between the check and the call; nothing to recover from.
      }
    }
  }

  private receive(data: unknown): void {
    const envelope = data as SprRespondentEnvelope | null;
    if (!envelope || typeof envelope.type !== 'string') {
      return;
    }
    if (envelope.type === 'hello') {
      this.sendSnapshot();
    }
  }

  private ensureChannel(sessionId: string): void {
    if (this._channel && this._channelSessionId === sessionId) {
      return;
    }
    this.closeChannel();
    try {
      this._channel = new BroadcastChannel(respondentChannelName(sessionId));
      this._channel.onmessage = this.onChannelMessage;
      this._channelSessionId = sessionId;
    } catch (e) {
      // Without a channel the handle transport still serves a window we opened ourselves.
      SprLogger.warn('Respondent display: no channel, falling back to the window handle.', e);
    }
  }

  private closeChannel(): void {
    if (this._channel) {
      try {
        this._channel.close();
      } catch (e) {
        // closing a broken channel is not worth reporting
      }
    }
    this._channel = null;
    this._channelSessionId = null;
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.onWindowMessage);
    window.removeEventListener('pagehide', this.onPageHide);
    window.removeEventListener('pageshow', this.onPageShow);
    this.closeChannel();
    this._mirror = null;
    this._snapshot = null;
  }
}

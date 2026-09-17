import {Component, HostBinding, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {PromptingContainer} from "../session/prompting";
import {TransportActions} from "../session/controlpanel";
import {SimpleTrafficLight} from "../startstopsignal/ui/simpletrafficlight";
import {State as StartStopSignalState} from "../startstopsignal/startstopsignal";
import {SprTranslator} from "../../i18n/translate";
import {SCHEME_ATTRIBUTE} from "../../theme/theme";
import {SprRespondentSnapshot, signalState} from "./respondent-snapshot";
import {
  SprRespondentEnvelope,
  respondentChannelName,
  respondentDisplaySupported,
} from "./respondent-channel";

/** How often a mirror that has not heard anything repeats its `hello`. */
const HELLO_INTERVAL_MS = 10000;

/**
 * The respondent display: the prompt stage of a running session, mirrored into its own window.
 *
 * It renders the very same components as the recorder's stage (`spr-recinstructions` through
 * `PromptingContainer` and the start/stop light), so text, decorated prompt blocks and images
 * cannot drift apart from what the operator sees — but nothing else: no progress rail, no audio
 * view, no transport, no status. The view holds no session of its own; it renders what the
 * recorder publishes and shows a waiting state until the first stage arrives.
 */
@Component({
  selector: 'spr-respondent-view',
  template: `
    @if (unsupported) {
      <div class="spr-respondent-message">
        <h1>{{ i18n.t('spr.respondent.unsupportedTitle') }}</h1>
        <p>{{ i18n.t('spr.respondent.unsupportedBody') }}</p>
      </div>
    } @else if (snapshot) {
      <div class="spr-respondent-bar">
        <app-simpletrafficlight [status]="signal"></app-simpletrafficlight>
      </div>
      <app-sprpromptingcontainer class="spr-respondent-stage" aria-live="polite"
        [projectName]="snapshot.projectName ?? undefined"
        [promptItem]="snapshot.prompt"
        [showPrompt]="snapshot.showPrompt"
        [selectedItemIdx]="snapshot.itemIndex ?? 0"
        [itemCount]="snapshot.itemCount ?? undefined"
        [transportActions]="inertActions"></app-sprpromptingcontainer>
      @if (snapshot.ended) {
        <div class="spr-respondent-message spr-respondent-ended">
          <h1>{{ i18n.t('spr.session.finishedTitle') }}</h1>
          <p>{{ i18n.t('spr.session.finishedBody') }}</p>
        </div>
      }
    } @else {
      <div class="spr-respondent-message">
        <h1>{{ i18n.t('spr.respondent.waitingTitle') }}</h1>
        <p>{{ i18n.t('spr.respondent.waitingBody') }}</p>
      </div>
    }
  `,
  styles: [`
    :host {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--spr-stage, #F1EFE4);
      color: var(--spr-stage-ink, #000000);
    }

    /* The signal sits above the stage, where the operator sees it too. */
    .spr-respondent-bar {
      flex: 0 0 auto;
      display: flex;
      justify-content: flex-end;
      padding: 12px 16px 0;
    }

    .spr-respondent-stage {
      flex: 1 1 auto;
      min-height: 0;
    }

    .spr-respondent-message {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 24px;
      text-align: center;
    }

    .spr-respondent-message h1 {
      margin: 0;
      font-size: var(--spr-type-section, 17.28px);
      font-weight: 700;
    }

    .spr-respondent-message p {
      margin: 0;
      max-width: 44em;
      color: var(--spr-ink-muted, #4A6288);
      font-size: var(--spr-type-caption, 13.6px);
    }

    /* The closing text is an overlay: the last prompt stays visible underneath. */
    .spr-respondent-ended {
      position: absolute;
      inset: 0;
      background: var(--spr-stage, #F1EFE4);
      color: var(--spr-stage-ink, #000000);
    }

    .spr-respondent-ended p {
      color: inherit;
    }
  `],
  standalone: false
})
export class SprRespondentView implements OnInit, OnDestroy {
  /** Session to mirror; the recorder publishes under the same id. */
  private sessionId = '';
  private seq = -1;
  private channel: BroadcastChannel | null = null;
  private helloTimerId: number | null = null;
  private appliedScheme = false;
  private readonly channelSupported = respondentDisplaySupported();

  /** Swipes on the respondent screen must not navigate: the mirror's actions are inert. */
  readonly inertActions = new TransportActions(new SprTranslator());
  snapshot: SprRespondentSnapshot | null = null;

  private readonly onWindowMessage = (event: MessageEvent) => {
    if (event.origin === location.origin) {
      this.receive(event.data);
    }
  };
  private readonly onVisibility = () => {
    if (document.visibilityState === 'visible') {
      this.sendHello();
    }
  };
  private readonly onPageShow = () => this.sendHello();

  constructor(private route: ActivatedRoute, readonly i18n: SprTranslator) {}

  /** True when neither transport can reach a recorder: no channel and no window to talk to. */
  get unsupported(): boolean {
    return !this.channelSupported && !window.opener;
  }

  @HostBinding('attr.data-spr-respondent')
  get respondentHost(): string {
    return this.sessionId;
  }

  get signal(): StartStopSignalState {
    return signalState(this.snapshot?.signal ?? 'OFF');
  }

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id') ?? '';
    document.title = this.i18n.t('spr.respondent.windowTitle', {session: this.sessionId});
    window.addEventListener('message', this.onWindowMessage);
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pageshow', this.onPageShow);
    this.openChannel();
    this.sendHello();
    this.helloTimerId = window.setInterval(() => this.sendHello(), HELLO_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.helloTimerId !== null) {
      window.clearInterval(this.helloTimerId);
      this.helloTimerId = null;
    }
    window.removeEventListener('message', this.onWindowMessage);
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pageshow', this.onPageShow);
    this.post({type: 'bye', sessionId: this.sessionId});
    this.closeChannel();
  }

  private openChannel(): void {
    if (!this.channelSupported) {
      return;
    }
    try {
      this.channel = new BroadcastChannel(respondentChannelName(this.sessionId));
      this.channel.onmessage = this.onWindowMessage;
    } catch (e) {
      this.channel = null;
    }
  }

  private closeChannel(): void {
    try {
      this.channel?.close();
    } catch (e) {
      // nothing to recover from
    }
    this.channel = null;
  }

  /** Reaches the recorder over both transports; duplicates are filtered by the sequence number. */
  private post(envelope: SprRespondentEnvelope): void {
    if (this.channel) {
      try {
        this.channel.postMessage(envelope);
      } catch (e) {
        // the channel may be closed already
      }
    }
    const opener = window.opener as Window | null;
    if (opener && !opener.closed) {
      try {
        opener.postMessage(envelope, location.origin);
      } catch (e) {
        // the recorder window may be gone
      }
    }
  }

  private sendHello(): void {
    if (this.sessionId) {
      this.post({type: 'hello', sessionId: this.sessionId});
    }
  }

  private receive(data: unknown): void {
    const envelope = data as SprRespondentEnvelope | null;
    if (!envelope || typeof envelope.type !== 'string') {
      return;
    }
    const snapshot = envelope.snapshot;
    if (envelope.type !== 'snapshot' || !snapshot || snapshot.sessionId !== this.sessionId) {
      return;
    }
    const seq = envelope.seq ?? 0;
    if (seq < this.seq) {
      return;   // a duplicate arrived out of order on the slower transport
    }
    this.seq = seq;
    this.snapshot = snapshot;
    this.applyScheme(snapshot.scheme);
  }

  /** Follows the recorder's scheme, but leaves a scheme the deployment set here alone. */
  private applyScheme(scheme: string | null): void {
    if (scheme) {
      document.documentElement.setAttribute(SCHEME_ATTRIBUTE, scheme);
      this.appliedScheme = true;
    } else if (this.appliedScheme) {
      document.documentElement.removeAttribute(SCHEME_ATTRIBUTE);
      this.appliedScheme = false;
    }
  }
}

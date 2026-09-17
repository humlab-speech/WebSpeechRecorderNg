import {Component,Input} from '@angular/core'
import {StartStopSignal, State} from '../startstopsignal'

/**
 * Subject-facing record/stop signal.
 *
 * The state is never encoded by hue alone: every state also changes which lamps are lit,
 * and the caption below the housing names the state in words (also announced to screen
 * readers, so a subject who cannot see the colour is not left guessing).
 *
 *   OFF           no lamps                     —
 *   IDLE          top lamp pink                Stop
 *   PRERECORDING  top lamp pink, mid lamp gold  Get ready
 *   RECORDING     bottom lamp green             Recording
 *   POSTRECORDING mid lamp gold                 Wait
 */
@Component({
    selector: 'app-simpletrafficlight',
    template: `

    <div class="housing">
      <div class="circle {{lighttop}}"></div>
      <div class="circle {{lightmid}}"></div>
      <div class="circle {{lightbottom}}"></div>
    </div>
    <span class="state-label" role="status" aria-live="polite">{{stateLabel}}</span>
  `,
    styles: [`:host {
             display: flex;
             flex-direction: column;
             align-items: center;
             gap: 8px;
             flex: 0 0 content;
           }`, `
    .housing {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px;
      border-radius: var(--spr-r-md, 12px);
      background: var(--spr-black, #000000);
      /* In the dark scheme the black box would merge with the page: the outline keeps the
         signal reading as hardware, independent of the luminance difference. */
      box-shadow: inset 0 0 0 1px var(--spr-housing-edge, transparent);
    }

    /* Umeå svart is the main colour for the housing; text on it is white. */
    .circle {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: var(--spr-lamp-off, rgba(42, 71, 101, 0.55));
      box-shadow: inset 0 0 0 1px var(--spr-canvas-grid, #24497E);
    }

    /* Complement colours, ink on them is black (Umeå brand rule). */
    .circle.hold {
      background: var(--spr-alert, #EABAB9);
      box-shadow: inset 0 0 0 2px var(--spr-alert-ink, #000000);
    }

    .circle.cue {
      background: var(--spr-caution, #D7B17C);
      box-shadow: inset 0 0 0 2px var(--spr-caution-ink, #000000);
    }

    .circle.live {
      background: var(--spr-ok, #73A790);
      box-shadow: inset 0 0 0 2px var(--spr-ok-ink, #000000);
    }

    .state-label {
      min-height: 20px;
      padding: 2px 8px;
      border-radius: var(--spr-r-sm, 6px);
      background: var(--spr-black, #000000);
      color: var(--spr-canvas-ink, #FFFFFF);
      font-size: var(--spr-type-caption, 13.6px);
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
    }`],
    standalone: false
})
export class SimpleTrafficLight implements StartStopSignal {

  lighttop!: string;
  lightmid!: string;
  lightbottom!: string;
  stateLabel = '';

  constructor() {
    this.status=State.OFF;
  }

  @Input()
  set status(status: State) {
    if (State.OFF === status) {
      this.lighttop = 'off';
      this.lightmid = 'off';
      this.lightbottom = 'off';
      this.stateLabel = '';
    } else if (State.IDLE === status) {
      this.lighttop = 'hold';
      this.lightmid = 'off';
      this.lightbottom = 'off';
      this.stateLabel = 'Stop';
    } else if (State.PRERECORDING == status) {
      this.lighttop = 'hold';
      this.lightmid = 'cue';
      this.lightbottom = 'off';
      this.stateLabel = 'Get ready';
    } else if (State.RECORDING == status) {
      this.lighttop = 'off';
      this.lightmid = 'off';
      this.lightbottom = 'live';
      this.stateLabel = 'Recording';
    } else if (State.POSTRECORDING == status) {
      this.lighttop = 'off';
      this.lightmid = 'cue';
      this.lightbottom = 'off';
      this.stateLabel = 'Wait';
    }
  }
}

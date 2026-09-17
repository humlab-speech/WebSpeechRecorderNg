import {Component, Input, OnInit} from "@angular/core";
import {CaptureDeviceService, SprCaptureDevice} from "../capture/capture-device.service";
import {SprTranslator} from "../../i18n/translate";

/**
 * Picks the microphone the session records from, in the audio view next to the play and zoom
 * controls. The list, the choice and the persistence live in `CaptureDeviceService`; the recorder
 * applies the choice at the next capture start (or immediately, when nothing is being recorded).
 */
@Component({
  selector: 'spr-capture-device-control',
  template: `
    <mat-icon class="spr-capture-icon" [matTooltip]="i18n.t('spr.capture.deviceTooltip')"
      aria-hidden="true">mic</mat-icon>
    @if (devices.state === 'none') {
      <span class="spr-capture-note">{{ i18n.t('spr.capture.none') }}</span>
    } @else if (devices.state === 'permission-needed') {
      <button type="button" (click)="requestDevices()"
        [matTooltip]="i18n.t('spr.capture.permissionNeeded')">{{ i18n.t('spr.capture.grantAccess') }}</button>
    } @else {
      <select class="spr-capture-select" [disabled]="disabled || devices.locked" [value]="selectedId()"
        (change)="select($event)" [matTooltip]="selectTooltip()"
        [attr.aria-label]="i18n.t('spr.capture.device')">
        <option value="">{{ i18n.t('spr.capture.default') }}</option>
        @for (device of devices.devices; track device.id) {
          <option [value]="device.id">{{ deviceLabel(device) }}</option>
        }
      </select>
      @if (devices.state === 'missing') {
        <span class="spr-capture-note spr-capture-warn">{{ i18n.t('spr.capture.missing') }}</span>
      }
    }
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
      color: var(--spr-canvas-ink, #FFFFFF);
      font-size: var(--spr-type-caption, 13.6px);
    }

    .spr-capture-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--spr-chrome-ink-muted, rgba(255, 255, 255, 0.62));
    }

    .spr-capture-select {
      max-width: 16em;
      padding: 2px 4px;
      border: 1px solid var(--spr-canvas-grid, #24497E);
      border-radius: var(--spr-r-sm, 8px);
      background: var(--spr-chrome-tint, rgba(255, 255, 255, 0.14));
      color: inherit;
      font: inherit;
    }

    .spr-capture-select:disabled {
      opacity: 0.6;
    }

    button {
      padding: 2px 8px;
      border: 1px solid var(--spr-canvas-grid, #24497E);
      border-radius: var(--spr-r-sm, 8px);
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }

    .spr-capture-note {
      color: var(--spr-chrome-ink-muted, rgba(255, 255, 255, 0.62));
    }

    .spr-capture-warn {
      color: var(--spr-caution, #D7B17C);
    }
  `],
  standalone: false
})
export class CaptureDeviceControl implements OnInit {

  /** Set by the embedding view when the recorder must not change devices right now. */
  @Input() disabled = false;

  constructor(readonly i18n: SprTranslator, readonly devices: CaptureDeviceService) {}

  ngOnInit(): void {
    void this.devices.refresh();
  }

  selectedId(): string {
    const stored = this.devices.stored;
    if (!stored) {
      return '';
    }
    // Browsers rotate device ids: show the id the remembered device has in this browser.
    return this.devices.matchDevice(stored)?.id ?? stored.id;
  }

  deviceLabel(device: SprCaptureDevice): string {
    return device.label || device.id;
  }

  selectTooltip(): string {
    if (this.devices.locked) {
      return this.i18n.t('spr.capture.locked');
    }
    if (this.devices.busy) {
      return this.i18n.t('spr.capture.recordingBlocked');
    }
    return this.i18n.t('spr.capture.deviceTooltip');
  }

  /** Must stay a user gesture: the browser asks for the microphone only on one. */
  requestDevices(): void {
    void this.devices.refresh(true);
  }

  select(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    if (!id) {
      this.devices.select(null);
      return;
    }
    const device = this.devices.devices.find((d) => d.id === id);
    this.devices.select(device ?? {id, label: ''});
  }
}

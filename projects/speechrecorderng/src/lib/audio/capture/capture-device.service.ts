import {Injectable, OnDestroy} from "@angular/core";
import {SprLogger} from "../../utils/logger";

/** An input device the operator can record from. */
export interface SprCaptureDevice {
  /** `MediaDeviceInfo.deviceId`. Browsers rotate it per origin, which is why the label is kept too. */
  id: string;
  /** `MediaDeviceInfo.label`; empty until the browser has been granted microphone access. */
  label: string;
}

/** What the picker has to say about the current selection. */
export type SprCaptureDeviceState =
  | 'unknown'            // not enumerated yet
  | 'ok'
  | 'permission-needed'  // devices exist, but the browser hides their labels until consent
  | 'none'               // no input device at all
  | 'missing';           // the remembered device is gone (unplugged, or another machine)

/** Why the service notified: only a `select` may reopen a running capture. */
export type SprCaptureDeviceChange = 'select' | 'refresh' | 'active' | 'locked' | 'busy';

/** Where the operator's choice is remembered. */
export const CAPTURE_DEVICE_STORAGE_KEY = 'spr.captureDevice';

/**
 * The recording device the operator picked in the audio view.
 *
 * The service holds the list, the choice and the state of both; the recorder decides at capture
 * start which device actually opens (the project's allow-list wins, see `BasicRecorder`), and
 * reports back which one it got. Nothing here touches `MediaStreamConstraints`: the chosen id is
 * handed to `AudioCapture.open()`, which is the single place that builds them.
 */
@Injectable()
export class CaptureDeviceService implements OnDestroy {

  private _devices: SprCaptureDevice[] = [];
  private _stored: SprCaptureDevice | null = null;
  private _active: SprCaptureDevice | null = null;
  private _state: SprCaptureDeviceState = 'unknown';
  private _locked = false;
  private _busy = false;
  private readonly listeners = new Set<(reason: SprCaptureDeviceChange) => void>();

  private readonly onDeviceChange = () => void this.refresh();

  constructor() {
    this._stored = this.readStored();
    navigator.mediaDevices?.addEventListener?.('devicechange', this.onDeviceChange);
    // Enumerating early lets the recorder resolve a remembered device (the id rotates, so it is
    // matched by label) before the first capture opens. Ids are visible without permission.
    void this.refresh();
  }

  /** Input devices, as far as the browser reveals them. */
  get devices(): SprCaptureDevice[] {
    return this._devices;
  }

  /** The operator's remembered choice, if any. */
  get stored(): SprCaptureDevice | null {
    return this._stored;
  }

  /** The device the capture actually opened — the truth the picker displays. */
  get active(): SprCaptureDevice | null {
    return this._active;
  }

  get state(): SprCaptureDeviceState {
    return this._state;
  }

  /** True while the project's `audioDevices` list governs the device: picking would have no effect. */
  get locked(): boolean {
    return this._locked;
  }

  /** True while a take is in flight: the recorder would not apply a switch right now. */
  get busy(): boolean {
    return this._busy;
  }

  setBusy(busy: boolean): void {
    if (this._busy !== busy) {
      this._busy = busy;
      this.notify('busy');
    }
  }

  setLocked(locked: boolean): void {
    if (this._locked !== locked) {
      this._locked = locked;
      this.notify('locked');
    }
  }

  subscribe(listener: (reason: SprCaptureDeviceChange) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Remembers a choice; `null` clears it and returns to the browser default. */
  select(device: SprCaptureDevice | null): void {
    this._stored = device;
    this.writeStored(device);
    this.notify('select');
  }

  /**
   * The id to open the capture with, or `undefined` for the browser default. A remembered device
   * that is no longer present is reported instead of substituted silently.
   */
  deviceIdForCapture(): string | undefined {
    const stored = this._stored;
    if (!stored) {
      return undefined;
    }
    const match = this.matchDevice(stored);
    if (!match) {
      this._state = 'missing';
      SprLogger.warn("Capture device: '" + (stored.label || stored.id) + "' is not available; the browser default is used.");
      return undefined;
    }
    return match.id;
  }

  /** Matches by id first, then by label: the id rotates, the label survives. */
  matchDevice(device: SprCaptureDevice): SprCaptureDevice | undefined {
    return this._devices.find((d) => d.id === device.id)
      ?? this._devices.find((d) => d.label !== '' && d.label === device.label);
  }

  /** Called by the recorder once the capture is open. */
  setActive(device: SprCaptureDevice | null): void {
    this._active = device;
    this.notify('active');
  }

  /**
   * Enumerates the input devices. With `requestPermission` — which must come from a user gesture —
   * a short probe stream asks for microphone access, because browsers return empty labels until
   * consent has been given once.
   */
  async refresh(requestPermission = false): Promise<void> {
    const media = navigator.mediaDevices;
    if (!media?.enumerateDevices) {
      this._state = 'unknown';
      this.notify('refresh');
      return;
    }
    try {
      let inputs = await this.inputDevices();
      if (requestPermission && inputs.length > 0 && inputs.every((i) => !i.deviceId || !i.label)) {
        await this.probePermission();
        inputs = await this.inputDevices();
      }
      this._devices = inputs.map((i) => ({id: i.deviceId, label: i.label}));
      this._state = this.computeState();
    } catch (e) {
      SprLogger.warn('Capture device: enumeration failed.', e);
      this._state = 'unknown';
    }
    this.notify('refresh');
  }

  ngOnDestroy(): void {
    navigator.mediaDevices?.removeEventListener?.('devicechange', this.onDeviceChange);
    this.listeners.clear();
  }

  private async inputDevices(): Promise<MediaDeviceInfo[]> {
    const infos = await navigator.mediaDevices.enumerateDevices();
    return infos.filter((i) => i.kind === 'audioinput');
  }

  private async probePermission(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      stream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      SprLogger.warn('Capture device: microphone access was not granted.', e);
    }
  }

  private computeState(): SprCaptureDeviceState {
    if (this._devices.length === 0) {
      return 'none';
    }
    if (this._devices.every((d) => !d.label)) {
      return 'permission-needed';
    }
    if (this._stored && !this.matchDevice(this._stored)) {
      return 'missing';
    }
    return 'ok';
  }

  private notify(reason: SprCaptureDeviceChange): void {
    this.listeners.forEach((listener) => listener(reason));
  }

  private readStored(): SprCaptureDevice | null {
    try {
      const raw = localStorage.getItem(CAPTURE_DEVICE_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<SprCaptureDevice>;
      if (!parsed || typeof parsed.id !== 'string') {
        return null;
      }
      return {id: parsed.id, label: typeof parsed.label === 'string' ? parsed.label : ''};
    } catch (e) {
      // Unreadable or private mode: start from the browser default.
      return null;
    }
  }

  private writeStored(device: SprCaptureDevice | null): void {
    try {
      if (device) {
        localStorage.setItem(CAPTURE_DEVICE_STORAGE_KEY, JSON.stringify(device));
      } else {
        localStorage.removeItem(CAPTURE_DEVICE_STORAGE_KEY);
      }
    } catch (e) {
      // private mode: the choice simply does not survive the reload
    }
  }
}

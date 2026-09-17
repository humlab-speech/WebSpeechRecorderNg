import {CAPTURE_DEVICE_STORAGE_KEY, CaptureDeviceService} from "./capture-device.service";

describe('CaptureDeviceService', () => {

  const mic: MediaDeviceInfo = {deviceId: 'mic-1', groupId: 'g', kind: 'audioinput', label: 'USB Microphone', toJSON: () => ({})};
  const other: MediaDeviceInfo = {deviceId: 'mic-2', groupId: 'g', kind: 'audioinput', label: 'Built-in', toJSON: () => ({})};
  const speaker: MediaDeviceInfo = {deviceId: 'spk', groupId: 'g', kind: 'audiooutput', label: 'Speakers', toJSON: () => ({})};

  let enumerate: jasmine.Spy;
  let original: MediaDevices | undefined;

  beforeEach(() => {
    localStorage.removeItem(CAPTURE_DEVICE_STORAGE_KEY);
    original = navigator.mediaDevices;
    enumerate = jasmine.createSpy('enumerateDevices');
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {enumerateDevices: enumerate, addEventListener: () => undefined, removeEventListener: () => undefined},
    });
  });

  afterEach(() => {
    localStorage.removeItem(CAPTURE_DEVICE_STORAGE_KEY);
    Object.defineProperty(navigator, 'mediaDevices', {configurable: true, value: original});
  });

  it('lists input devices only', async () => {
    enumerate.and.returnValue(Promise.resolve([mic, speaker, other]));
    const service = new CaptureDeviceService();

    await service.refresh();

    expect(service.devices.map((d) => d.id)).toEqual(['mic-1', 'mic-2']);
    expect(service.state).toBe('ok');
  });

  it('reports that access is needed while the browser hides the labels', async () => {
    enumerate.and.returnValue(Promise.resolve([{...mic, label: ''}]));
    const service = new CaptureDeviceService();

    await service.refresh();

    expect(service.state).toBe('permission-needed');
  });

  it('remembers the chosen device and survives a rotated device id', async () => {
    enumerate.and.returnValue(Promise.resolve([mic, other]));
    const service = new CaptureDeviceService();
    await service.refresh();
    service.select({id: 'mic-1', label: 'USB Microphone'});
    expect(service.stored).toEqual({id: 'mic-1', label: 'USB Microphone'});

    // a new browser session hands out a new id for the same microphone
    enumerate.and.returnValue(Promise.resolve([{...mic, deviceId: 'mic-9'}, other]));
    const next = new CaptureDeviceService();
    await next.refresh();

    expect(next.stored!.id).toBe('mic-1');
    expect(next.deviceIdForCapture()).toBe('mic-9');
    expect(next.state).toBe('ok');
  });

  it('falls back to the browser default, and says so, when the device is gone', async () => {
    enumerate.and.returnValue(Promise.resolve([other]));
    const service = new CaptureDeviceService();
    service.select({id: 'mic-1', label: 'USB Microphone'});
    await service.refresh();

    expect(service.deviceIdForCapture()).toBeUndefined();
    expect(service.state).toBe('missing');
  });

  it('clears the choice and reports no device at all', async () => {
    enumerate.and.returnValue(Promise.resolve([]));
    const service = new CaptureDeviceService();
    service.select({id: 'mic-1', label: 'USB Microphone'});
    service.select(null);
    await service.refresh();

    expect(service.stored).toBeNull();
    expect(localStorage.getItem(CAPTURE_DEVICE_STORAGE_KEY)).toBeNull();
    expect(service.state).toBe('none');
  });
});

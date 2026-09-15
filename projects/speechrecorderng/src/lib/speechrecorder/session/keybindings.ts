/**
 * Single source of truth for the recorder's keyboard shortcuts.
 *
 * Key values are `KeyboardEvent.key` strings. The key handlers in
 * `audiorecorder.ts` and `sessionmanager.ts`, the transport-button
 * tooltips, and the in-app manual all read from here so the three
 * cannot drift apart.
 */

export const KEY = {
  START_STOP: ' ',
  PAUSE: 'p',
  STOP: 'Escape',
  PLAY: 'MediaPlayPause',
  FORWARD: 'ArrowRight',
  BACKWARD: 'ArrowLeft',
} as const;

export interface KeyBinding {
  /** `KeyboardEvent.key` value. */
  key: string;
  /** Human-readable key name shown in tooltips and the manual. */
  label: string;
  /** One-line description of what the key does. */
  description: string;
}

export const KEY_BINDINGS: KeyBinding[] = [
  { key: KEY.START_STOP, label: 'Space', description: 'Start or stop recording' },
  { key: KEY.PAUSE, label: 'P', description: 'Pause recording' },
  { key: KEY.STOP, label: 'Esc', description: 'Stop recording and collapse the audio view' },
  { key: KEY.PLAY, label: 'Media Play/Pause', description: 'Play back the recording' },
  { key: KEY.FORWARD, label: '→', description: 'Go to the next prompt' },
  { key: KEY.BACKWARD, label: '←', description: 'Go to the previous prompt' },
];

/** Human-readable label for a key value, falling back to the raw value. */
export function keyLabel(key: string): string {
  const binding = KEY_BINDINGS.find((b) => b.key === key);
  return binding ? binding.label : key;
}

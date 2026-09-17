import {PromptItem} from "../script/script";
import {State as StartStopSignalState} from "../startstopsignal/startstopsignal";

/**
 * The stage of a recording session, as the respondent window receives it.
 *
 * Deliberately plain data: it crosses the window boundary through the structured clone
 * algorithm, so it may hold nothing but primitives and the plain interfaces of `script.ts`
 * (`PromptItem` is data, `PromptitemUtil` is a separate helper). Everything the mirror renders
 * is in here, which is what keeps the two windows from drifting apart.
 */
export interface SprRespondentSnapshot {
  /** Session the stage belongs to; also names the channel. */
  sessionId: string;
  /** Project of the session, needed to resolve image prompts. */
  projectName: string | null;
  /** Index of the shown prompt, `null` before the script arrived. */
  itemIndex: number | null;
  /** Number of prompts, for the "i/n" prefix of the instruction line. */
  itemCount: number | null;
  /** Instruction of the current prompt (`PromptItem.recinstructions`). */
  instruction: string | null;
  /** Whether the operator shows the prompt (`SessionManager.showPrompt`) — the mirror follows. */
  showPrompt: boolean;
  /** The prompt itself: text, decorated blocks or an image. */
  prompt: PromptItem | null;
  /** Start/stop signal as a name; a const enum cannot cross the window boundary. */
  signal: SprSignalName;
  /** Session finished: the mirror keeps its window and shows the closing text. */
  ended: boolean;
  /** Scheme of the recorder window (`data-spr-scheme`), so the mirror matches its look. */
  scheme: string | null;
}

export type SprSignalName = 'IDLE' | 'PRERECORDING' | 'POSTRECORDING' | 'RECORDING' | 'OFF';

export function signalName(state: StartStopSignalState): SprSignalName {
  switch (state) {
    case StartStopSignalState.IDLE:
      return 'IDLE';
    case StartStopSignalState.PRERECORDING:
      return 'PRERECORDING';
    case StartStopSignalState.POSTRECORDING:
      return 'POSTRECORDING';
    case StartStopSignalState.RECORDING:
      return 'RECORDING';
    default:
      return 'OFF';
  }
}

export function signalState(name: SprSignalName): StartStopSignalState {
  switch (name) {
    case 'IDLE':
      return StartStopSignalState.IDLE;
    case 'PRERECORDING':
      return StartStopSignalState.PRERECORDING;
    case 'POSTRECORDING':
      return StartStopSignalState.POSTRECORDING;
    case 'RECORDING':
      return StartStopSignalState.RECORDING;
    default:
      return StartStopSignalState.OFF;
  }
}

/** The values the recorder reads off its own state; kept apart so the mapping is testable. */
export interface SprRespondentStageValues {
  sessionId: string;
  projectName: string | null;
  itemIndex: number | null;
  itemCount: number | null;
  instruction: string | null;
  showPrompt: boolean;
  prompt: PromptItem | null;
  signal: StartStopSignalState;
  ended: boolean;
  scheme?: string | null;
}

export function buildRespondentSnapshot(values: SprRespondentStageValues): SprRespondentSnapshot {
  return {
    sessionId: values.sessionId,
    projectName: values.projectName,
    itemIndex: values.itemIndex,
    itemCount: values.itemCount,
    instruction: values.instruction,
    showPrompt: values.showPrompt,
    prompt: values.prompt,
    signal: signalName(values.signal),
    ended: values.ended,
    scheme: values.scheme ?? null,
  };
}

import {Injectable, InjectionToken} from "@angular/core";
import {UploadConfig} from "./net/uploader";
import {SprLogLevel} from "./utils/logger";

export const SPEECHRECORDER_CONFIG = new InjectionToken<SpeechRecorderConfig>('speechrecorder.config');


export enum ApiType {
  NORMAL,FILES
}

/**
 * A logo shown in one of the recorder's branding slots.
 *
 * The assets are deployment specific (funding bodies, project marks), so the module ships
 * none: an application points at its own files, e.g. `/assets/img/sweclarin_logo.png`.
 * Marks are never recoloured — they keep their own brand colours.
 */
export interface SprLogo {
  /** Image URL, resolved by the application. */
  src: string;
  /** Real alt text; these marks are informative, not decorative. */
  alt: string;
  /** Funding bodies' marks link to their site (opens in a new tab). */
  href?: string;
  /** Height in px, overrides the slot default. Width follows the aspect ratio. */
  height?: number;
  /** Optional variant for the dark scheme (`data-spr-scheme="dark"`). */
  srcDark?: string;
}

/** Placement of the logos inside the recorder. Every slot is optional. */
export interface SpeechRecorderBranding {
  /** Top right of the prompt stage, beside the instruction line. */
  promptStage?: SprLogo;
  /** Footer of the progress rail, below the prompt list. */
  progressFooter?: SprLogo[];
  /** Right hand side of the transport bar, before the state indicators. */
  controls?: SprLogo[];
}

@Injectable()
export class SpeechRecorderConfig{
  apiEndPoint?: string | null=null;
  apiType?: ApiType | null=null;
  apiVersion: number=1;
  withCredentials?: boolean=false;
  enableDownloadRecordings?: boolean=false;
  enableUploadRecordings?: boolean=true;
  uploadConfig?: UploadConfig;
logLevel?: SprLogLevel;
// Encrypt audio chunks at rest in IndexedDB (AES-GCM, session scoped key). Default: false
encryptPersistentRecordings?: boolean=false;
/**
 * Logos of the deploying institution and its funding bodies. Not set: the recorder renders
 * without any marks, which is what a generic deployment wants.
 */
branding?: SpeechRecorderBranding;
/**
 * Key (a `KeyboardEvent.key` value) that opens or focuses the respondent display. Not set: the
 * built-in default in `keybindings.ts` applies. A key already taken by another shortcut is
 * reported at startup and the default is kept.
 */
respondentDisplayKey?: string | null = null;
  constructor(){
    this.apiEndPoint=null;
    this.apiType=null;
    this.withCredentials=false;
  }
}


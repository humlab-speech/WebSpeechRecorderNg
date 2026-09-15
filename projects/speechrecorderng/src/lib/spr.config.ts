import {Injectable, InjectionToken} from "@angular/core";
import {UploadConfig} from "./net/uploader";
import {SprLogLevel} from "./utils/logger";

export const SPEECHRECORDER_CONFIG = new InjectionToken<SpeechRecorderConfig>('speechrecorder.config');


export enum ApiType {
  NORMAL,FILES
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
  constructor(){
    this.apiEndPoint=null;
    this.apiType=null;
    this.withCredentials=false;
  }
}


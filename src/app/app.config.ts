import {ApiType, SpeechRecorderConfig} from "../../projects/speechrecorderng/src/lib/spr.config";
import {environment} from "../environments/environment";

const IMG = 'assets/img';

export const SPR_CFG: SpeechRecorderConfig = {
  apiEndPoint: environment.apiEndPoint,
  apiType: (environment.apiType==='files')?ApiType.FILES:ApiType.NORMAL,
  apiVersion:environment.apiVersion,
  withCredentials:true,
  enableDownloadRecordings: environment.enableDownloadRecordings,
  enableUploadRecordings: environment.enableUploadRecordings,
  // Marks of this deployment. The module ships none of these files: they are served from
  // src/assets/img and the library stays neutral for other deployments.
  branding: {
    promptStage: {
      src: `${IMG}/visp_slogan_sv.svg`,
      alt: 'VISP — Visible Speech',
      height: 28
    },
    controlsLeft: [
      {
        src: `${IMG}/sweclarin_logo.png`,
        alt: 'SweCLARIN logo',
        href: 'https://www.sweclarin.se/',
        height: 24
      }
    ],
    controls: [
      {
        src: `${IMG}/bas.png`,
        alt: 'Bavarian Archive for Speech Signals logo',
        href: 'https://www.bas.uni-muenchen.de/Bas/BasHomeeng.html',
        height: 26
      },
      {
        src: `${IMG}/clarin-d.png`,
        alt: 'CLARIN-D logo',
        href: 'https://www.clarin-d.net/en/',
        height: 28
      }
    ]
  }
};

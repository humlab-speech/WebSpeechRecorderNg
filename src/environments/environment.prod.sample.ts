// Template for the deployment specific `src/environments/environment.prod.ts`.
//
// A production build (`npm run build`, the default configuration) replaces `environment.ts` with
// that file, see the `fileReplacements` entry in angular.json. It is not tracked by git, so every
// deployment configures its own API endpoint: copy this sample over and edit the values. `npm run
// build` performs that copy when the file is missing, so a fresh checkout builds with these
// defaults.

export const environment = {
  production: true,
  apiType: 'normal',
  apiEndPoint: 'api/v1',
  apiVersion:1,
  enableDownloadRecordings:false,
  enableUploadRecordings: true
};

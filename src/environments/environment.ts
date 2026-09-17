// Default configuration: `ng serve` and `ng build --configuration development` use this file.
// A production build replaces it with the deployment specific `environment.prod.ts`, see the
// `fileReplacements` entry in angular.json and environment.prod.sample.ts.

export const environment = {
  production: false,
  apiType: 'files',
  apiEndPoint: 'test',
  apiVersion: 1,
  enableDownloadRecordings:true,
  enableUploadRecordings: false
};

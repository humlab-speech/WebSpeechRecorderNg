# SpeechRecorderNg

A Speech Recording Tool implemented as an Angular 20 module.

## Migrate from version 2.x.x to 3.x.x
For backwards compatibility to server REST API v1 set the property `apiVersion: 1` in your environment file.

## Integrate SpeechRecorder module to your web application

### Install NPM package
Speechrecorder module is available as NPM package.
Add `"speechrecorderng": "3.11.26"` to the `dependencies` array property in the `package.json` file of your application. Run `npm install` to install the package.
### Module integration
Add SpeechRecorderNg module to 'imports' property of your `AppModule` annotation. The module main component `SpeechRecorder` should be activated by an Angular route.

#### Example `app.module.ts`
```
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {SpeechrecorderngComponent, SpeechRecorderConfig, SpeechrecorderngModule} from 'speechrecorderng'
import {RouterModule, Routes} from '@angular/router';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MdButtonModule, MdDialogModule, MdIconModule, MdMenuModule, MdToolbarModule} from "@angular/material";

const MY_APP_ROUTES: Routes = [
  { path: 'spr', component: SpeechrecorderngComponent}
];

const SPR_CFG:SpeechRecorderConfig={
  apiEndPoint: '/myapppath/api/v1'
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    RouterModule.forRoot(MY_APP_ROUTES),BrowserModule,BrowserAnimationsModule,SpeechrecorderngModule.forRoot(SPR_CFG)
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### HTML/CSS integration
 Speechrecorder is intended to run in a layout which always fits to the browser viewport without scrollbars. The subject should not be distracted from performing the recording session.
 Therefore the module should be embedded in HTML page with 100% height and without padding or margin.
 At least the CSS properties `margin-top`,`margin-bottom`,`padding-top`,`padding-bottom` should be zero and `height` should be `100%` for the DOM elements `html` and `body`
#### Example `index.html`
 ```
   <!doctype html>
   <html lang="en" style="height:100%;margin:0;padding:0">
   <head>
     <meta charset="utf-8">
     <title>My application</title>
     <base href="/">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
   </head>
   <body style="height:100%;margin:0;padding:0">
     <app-root class="mat-typography"></app-root>
   </body>
   </html>
   ```
 The SpeechRecorder component will appear in the Angular `router-outlet` element, if a route for the `SpeechRecorder` component is matched.  
   
 #### Example `app.component.html` with Material Design menubar 
 ```
 <md-toolbar color="primary">
 
   <button md-button [mdMenuTriggerFor]="menu">
     <md-icon>menu</md-icon>
   </button>
   <md-menu #menu="mdMenu" yPosition="below" [overlapTrigger]="false">
     <button md-menu-item  [mdMenuTriggerFor]="helpMenu">Help</button>
     <md-menu #helpMenu="mdMenu" xPosition="after" [overlapTrigger]="false">
       <p>My application</p>
     </md-menu>
   </md-menu>
   &nbsp;<span>My Application</span>
 </md-toolbar>
 <router-outlet></router-outlet>
 ```
   
## Theme (Umeå University)

The recorder is themed with the Umeå University palette. Everything visual is a CSS custom
property, so an application can drop the recorder into its own brand without touching
component code.

    huvudfärger       #2A4765 (chrome)   #000000 (canvas, traffic light)
                      text on these is always white
    komplementfärger  #73A790 #D7B17C #EABAB9 #F1EFE4
                      text on these is always black

### Include the theme

```scss
@use '@angular/material' as mat;
@use 'speechrecorderng/theme' as spr;

html {
  @include mat.theme((
    color: (primary: my-primary-palette, theme-type: light),
    typography: 'Inter, "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif',
    density: 0,
  ));
  @include spr.theme();       // --spr-* tokens + brand values for the Material roles
  @include spr.theme-dark();  // optional: needs <html data-spr-scheme="dark">
}
```

Include `spr.theme()` *after* your Material theme: it pins `--mat-sys-primary`,
`--mat-sys-error`, the surface roles and the toolbar colors to the brand values, so the
source order decides. Without any theme include the recorder still renders, because every
`var(--spr-*, …)` carries the brand value as a fallback.

### Palette and roles

| Token | Value | Role |
|---|---|---|
| `--spr-chrome` / `--spr-chrome-ink` | `#2A4765` / `#FFFFFF` | toolbar, primary buttons, selected row (9.60:1) |
| `--spr-chrome-grad` / `--spr-chrome-glow` | navy ramp + warm glow | app bar background |
| `--spr-page` | `#EEF1F5` | application background |
| `--spr-surface` / `--spr-surface-2` / `--spr-surface-3` | `#FFFFFF` / `#F8FAFD` / `#EDF2F8` | panels, table header, inset |
| `--spr-stage` / `--spr-stage-ink` | `#F1EFE4` / `#000000` | prompt stage (18.21:1) |
| `--spr-ink` / `--spr-ink-muted` / `--spr-ink-subtle` | `#1F3044` / `#4A6288` / `#6D7C98` | body, secondary, non-essential |
| `--spr-border` / `--spr-border-strong` / `--spr-divider` | `#D8DFE8` / `#C7D1DF` / `#E9EDF3` | lines |
| `--spr-ok` / `--spr-caution` / `--spr-alert` | `#73A790` / `#D7B17C` / `#EABAB9` | recording-done, warning/level, error — ink is `--spr-*-ink` (black) |
| `--spr-canvas` / `--spr-canvas-ink` / `--spr-canvas-signal` | `#0E1A26` / `#FFFFFF` / `#73A790` | signal + spectrogram surface |
| `--spr-black` / `--spr-lamp-off` | `#000000` / navy 55% | traffic light housing and unlit lamp |
| `--spr-r-sm … --spr-r-xl` | 6 / 12 / 14 / 22 px | radii |
| `--spr-shadow-card` / `-bar` / `-cta` / `-overlay` | blue-tinted shadows | elevation |

`app-simpletrafficlight` is the subject-facing state signal. The state is encoded three
ways — lamp position, lamp colour and a caption ("Recording", "Get ready", …), which is
also announced through `role="status"`.

### Overriding

```scss
:root {
  --spr-chrome: #123456;
}
```

Canvas painters (waveform, spectrogram, level meter) read the same tokens through
`sprToken('spr-canvas-signal')` and friends, so an override reaches them as well.
`SPR_SPECTRUM_RAMP` (exported from the package) is the luminance-monotonic spectrogram
ramp; `buildSpectrumLut()` turns it into the table the sonagram worker paints with.

### Audit

`bin/theme_audit.mjs` renders the application in a headless Chrome (DevTools Protocol) and
fails on legacy colour literals, contrast below WCAG AA, text below 13.6 px, or a document
that scrolls:

```
node bin/theme_audit.mjs --url http://127.0.0.1:4200/spr \
  --viewports 1024x768,1366x768,1568x1334,1920x1080 --verbose
```

### Deployment on the server
See [Angular Deployment/Server Configuration](https://angular.io/guide/deployment#server-configuration) for details.

To distinguish between the REST API base paths and the path for the web application the application should not be deployed to the top level directory of your Web-server.
Choose an arbitrary base path for the app e.g. `/wsr/ng/dist/` and build the app accordingly:
```
ng build --base-href=/wsr/ng/dist/ --prod
```
Copy the dist folder to ```/wsr/ng/``` on your Web-Server and setup the fallback configuration for this path in your Web-Server.


   
### Server REST API

SpeechRecorder requires a HTTP server providing a REST API. The server code is not part of this package.
The package only contains a minimal file structure for testing. The files reside in `src/test`.

Versions 2.x.x of WebSpeechRecorderNg use the REST API version v1, Versions 3.x.x may use API version v1 and  v2. Set environment property apiVersion accordingly (default: `apiVersion: 1`) 

## Configuration

By default the API Endpoint ({apiEndPoint}) is an empty string, the API is then expected to be relative to the base path of the application. 

### Logging

All library log output goes through a level gated logger. The level is configured with `logLevel` in `SpeechRecorderConfig` (`SprLogLevel.DEBUG`, `INFO` (default), `WARN`, `ERROR`, `OFF`). With the default level, debug output is suppressed.

### Security

* The application must be served over HTTPS: browser microphone access requires a secure context, and recordings may contain sensitive personal information.
* When `withCredentials: true` is configured (cookie based authentication), the server must implement CSRF protection, e.g. by requiring a CSRF token on state changing requests or by setting `SameSite=Strict`/`SameSite=Lax` on the session cookie. The client does not add a CSRF token.
* Prefer token based authentication via the `Authorization` header over cookies.
* A strict Content-Security-Policy must allow blob workers and blob audio worklet modules: `worker-src 'self' blob:`, `media-src blob:`.
* Recording files and their metadata are considered personal data; the server should apply access control, transport encryption and retention policies accordingly.
* When recordings are stored client side in IndexedDB (`DB_CHUNKED` storage), they are plaintext by default. Set `encryptPersistentRecordings: true` in `SpeechRecorderConfig` to encrypt chunks at rest with AES-GCM (WebCrypto). The key is session scoped: a page reload in the same browser session can still decrypt, a browser restart cannot (stale encrypted chunks become unreadable and should be cleaned up server side). Playback and download of encrypted recordings work transparently.

## SpeechRecorder REST API description

### Entity Project

REST Path: GET {apiEndPoint}project/{projectId}

Content-type: application/json

Example for Mono recordings:

```
{
 "name": "My project",
 "audioFormat" : {
   "channels": 1
  }
}
```
### Entity Session

Current recording session data.

REST Path: GET {apiEndPoint}session/{sessionId}

Content-type: application/json

Properties: 
 * sessionId: number: Unique ID of the session
 * script: number: Unique ID of recording script 

Example:
```
{
  "sessionId": "2",
  "project": "My project",
  "script": "1245"
}
```  

During the session the application will try to update the session object on the server by HTTP PATCH requests.
The session properties status,loadedDate,startedTrainingDate,startedDate,completedDate and restartedDate 
will be patched accordingly to the session events.

REST Path: PATCH {apiEndPoint}session/{sessionId}

Content-type: application/json

Properties (only changed properties are set): 
 * status: enum: "CREATED" | "LOADED" | "STARTED_TRAINING" | "STARTED" | "COMPLETED"  status of the session 
 * loadedDate: string: date/time when session was loaded
 * startedTrainingDate: string: date/time when a training section was started
 * startedDate: string: date/time of recording start
 * completedDate: string: date/time of session completed
 * restartedDate: string: date/time of a session restart (continue) 

For example when the session and script is loaded successfully, this PATCH request might be sent:
```
 {"status":"LOADED","loadedDate":"2020-03-25T12:52:12.616Z"}
```

### Entity Script

Recording script controls recording session procedure. 

REST Path: GET {apiEndPoint}script/{scriptId}

Content-type: application/json

Properties:
 * type: script: constant: Must be `"script"`
 * scriptId: number: Unique ID of the script
 * sections: array: Array of recording session sections

### Embedded entity Section

Properties:
 * name: Optional name of section
 * mode: enum: `MANUAL`, `AUTOPROGRESS` or `AUTORECORDING`
 * promptUnits: array: List of prompt units.
 * training: boolean: Section is intended as training for the subject. The recording items of a training section are ignored when the completeness of the session (each prompt item is recorded) is checked.

### Embedded entity Prompt Unit

Properties:

 * recpromptId: Unique ID of this recording prompt 
 * itemcode: string: In the scope of the script unique identifier of an recording item
 * mediaitems: array: List of media items for this prompt. Currently only a single mediaitem element in the array is supported.

### Embedded entity Media item

Properties (supported properties only):
 * text: string: Text to prompt

Example script:
```
{
  "type": "script",
  "scriptId": "1245",
  "sections": [
    {
      "mode": "MANUAL",
      "name": "Introduction",
      "groups": [
        {
          "promptItems": [
            {
              "itemcode": "I0",
              "mediaitems": [
                {
                  "text": "Willkommen bei der IPS-Sprachaufnahme!"
                }
              ],
              
            },
            {
              "itemcode": "I1",
              "mediaitems": [
                {
                  "text": "Hier steht der Prompt; ein kurzer Text, den Sie lesen, eine Frage, die Sie beantworten oder ein Bild, das Sie beschreiben sollen."
                }
              ],
              
            }
          ]
        }
      ],
      "training": false
    },
    {
      "mode": "AUTOPROGRESS",
      "name": "Recording Session",
      "groups": [
        {
          "promptItems": [
            {
              "itemcode": "N0",
              "recduration": 10000,
              "mediaitems": [
                {
                  "text": "What's your name?"
                }
              ],
              
            },
            {
              "itemcode": "S0",
              "mediaitems": [
                {
                  "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                }
              ],
              
            }
          ]
        }
      ]
    }
  ]
}
           
```  

### Recording file

SpeechRecorder stores the recording in browser memory first. The recordings are then uploaded to the server as binary encoded WAVE files.

Path: POST {apiEndPoint}session/{sessionId}/recfile/{itemcode}

Content-Type: audio/wav

There might be multiple uploads for one recording item, when the subject repeats a recording. The server is responsible to handle this uploads.
The server should apply a unique identifier for each uploaded recording file. Subsequent recording uploads for the same itemcode should get different IDs and should be stored with a version number starting with zero.    
A GET request to the URL should return the latest upload.  

### Upload robustness and backend requirements

The upload queue is failure tolerant: every upload request carries an idempotency key, transient failures are retried with exponential backoff and permanent failures are reported to the user.

#### Idempotency

All upload POST requests (recording file, prepare, chunk and concat endpoints) include the header:

```
Idempotency-Key: <uuid>
```

The key identifies one logical upload and is identical across retries of the same request. A request may be retried because the client aborted a previous attempt after a timeout even though the server had already stored the payload.

The server should:

* treat the pair (idempotency key, target URL) as unique within a TTL (e.g. 24h) and return the result of the original request instead of storing a duplicate;
* additionally deduplicate chunk uploads by the recording file UUID and chunk index (`{uuid}/{chunkIdx}`);
* reject `concatChunksRequest` with a 4xx status when the stored chunk count does not match the requested `chunkCount`.

#### Chunked upload endpoints

When the client streams recordings (NET_CHUNKED storage), it uses these endpoints:

* `POST {apiEndPoint}session/{sessionId}/recfile/{uuid}/prepareChunksRequest` — FormData: `uuid`, `startedDate` (ISO date). Opens the recording file for chunked upload.
* `POST {apiEndPoint}session/{sessionId}/recfile/{uuid}/{chunkIdx}` — body: WAVE encoded audio chunk, `chunkIdx` 0-based and ascending. The `spr` route variant posts to `recfile/{itemcode}/{uuid}/{chunkIdx}` instead.
* `POST {apiEndPoint}session/{sessionId}/recfile/{uuid}/concatChunksRequest` — FormData: `uuid`, `chunkCount`. Concatenates the stored chunks and closes the recording file.

#### Status codes

The client classifies failures as follows:

| Response | Handling |
|---|---|
| 2xx | Success. The recording is marked as server persisted. |
| 408, 425, 429, 5xx | Transient: retried with exponential backoff + jitter (default up to 8 attempts, delays 1s..60s). |
| other 4xx | Permanent: not retried. The upload is marked failed and an error message is shown. The user can retry all failed uploads. |
| Network error / timeout | Transient, retried (the idempotency key prevents duplicates). |

Permanent conditions (unknown session or recording file, size limits, authentication) must therefore be answered with 4xx statuses other than 408/425/429.

#### Error responses

On 4xx the response body should be JSON `{"error": "human readable message"}` or plain text. The message is shown to the user.

#### Strict acknowledgement (optional)

By default any 2xx response counts as stored. If the server confirms storage explicitly, set `uploadConfig.requireStoredAck = true` in `SpeechRecorderConfig`; every successful store must then respond with the JSON body `{"stored": true}`.

#### Client configuration

`SpeechRecorderConfig.uploadConfig` accepts:

* `maxAttempts` (default 8) — total POST attempts per upload.
* `baseRetryDelayMs` (default 1000) and `maxRetryDelayMs` (default 60000) — bounds of the exponential retry backoff.
* `jitterRatio` (default 0.25) — relative jitter applied to retry delays.
* `requireStoredAck` (default false) — require the `{"stored": true}` response body.
* `idempotencyHeader` (default `Idempotency-Key`) — header name carrying the idempotency key.
* `maxConcurrentUploads` (default 1) — maximum number of POST requests in flight. When set above 1, the server must tolerate uploads arriving out of order (e.g. chunk POSTs in flight while the prepare request is still being processed).
* `checkStoredChunkBeforeUpload` (default false) — check via GET `{chunkUrl}/{chunkIdx}` whether the server already holds a chunk before uploading it (2xx = stored, 404 = not stored). Enables safe re-upload after a crash or reload.
* `persistQueue` (default false) — persist Blob uploads to IndexedDB before POSTing. Pending uploads survive a page reload: the library restores and re-queues them on startup with the same idempotency keys, so the server can deduplicate uploads that already succeeded before the reload.

A recording is only marked as server persisted after the server acknowledges the upload. While uploads are pending or have terminally failed, the client blocks page navigation and does not mark the session as complete.


### Start a recording session

The default routing path to start a recording session is `/spr/session/{sessionId}`. If you call this router link from your Angular application
WebSpeechRecorderNg should start and will try to load the session data from the REST API first.
 
## GUI components to view and edit your recording database

### Edit or view recording files
To edit a selection of a recording file call the router link: 
`/spr/db/recordingfile/{recordingFileId}`

To only view a recording file: 
`/spr/db/recordingfile/_view/{recordingFileId}`


The application will send in both modes the following requests to the REST API:

1. Recording file meta data

Path: POST {apiEndPoint}recordingfile/{recordingFileId}

Accept: application/json

```
{
    "recordingFileId": "5678",
    "session": 2,
    "version": 0,
    "recording": {
        "itemcode": "N0",
        "recduration": 10000,

        "recinstructions": {
            "recinstructions": "Please answer:"
        },
        "mediaitems": [
            {
                "annotationTemplate": false,
                "autoplay": false,
                "mimetype": "text/plain",
                "text": "What's your name?"
            }
        ]
    }
}
``` 

2. The recording file itself:

(Same URL however it requests an audio MIME type )

Path: POST {apiEndPoint}recordingfile/{recordingFileId}

Accept: audio/wav


and optional to navigate through recording files of the same session:

3. Session data of this recording file 

REST Path: GET {apiEndPoint}session/{sessionId}

Content-type: application/json


4. The recording file list of the session if the session ID could be retrieved:

REST Path: GET {apiEndPoint}project/{projectId}/session/{sessionId}/recfile

Content-type: application/json


A server response might look like this:

```
[ {
    "recordingFileId": "1234",
    "session": 2,
    "date" : "2020-05-01T20:03:00.456+01:00",
    "recording" : {
      "mediaitems" : [ {
        "annotationTemplate" : true,
        "text" : "Heute ist schönes Frühlingswetter!"
      } ],
      "itemcode" : "demo_99",
      "recduration" : 4000,
      "recinstructions" : {
        "recinstructions" : "Please read:"
      }
    }
  },
  {
    "recordingFileId": "5678",
    "session": 2,
    "date" : "2020-06-10T20:04:44.123+01:00",
    "version": 0,
    "recording": {
      "itemcode": "N0",
      "recduration": 10000,

      "recinstructions": {
        "recinstructions": "Please answer:"
      },
      "mediaitems": [
        {
          "annotationTemplate": false,
          "autoplay": false,
          "mimetype": "text/plain",
          "text": "What's your name?"
        }
      ]
    }
  },
  {
    "recordingFileId": "9999",
    "session": 2,
    "date" : "2020-06-15T 18:05:19.000+01:00",
    "version": 1,
    "recording": {
      "itemcode": "N0",
      "recduration": 10000,

      "recinstructions": {
        "recinstructions": "Please answer:"
      },
      "mediaitems": [
        {
          "annotationTemplate": false,
          "autoplay": false,
          "mimetype": "text/plain",
          "text": "What's your name?"
        }
      ]
    }
  }
]
```

5. Get the recording file:
Path: GET {apiEndPoint}project/{projectId}/session/{sessionId}/recfile
Accept: audio/wav

Content-type: audio/wav

   API v2 extension: 
   The server must be able to deliver sections of a recording file as a valid WAVE file.
   The section will be selected by the query parameters `startFrame` for the start position and `frameLength` for the length of the section.
   The client will not send this queries with API v1.

Path: GET {apiEndPoint}project/{projectId}/session/{sessionId}/recfile?startFrame={startFrame}&frameLength={frameLength}
Accept: audio/wav

Content-type: audio/wav

6. Save edit selection:

Path: PATCH {apiEndPoint}recordingfile/{recordingFileId}

Accept: application/json

Sends `editSampleRate`,`editStartFrame` and `editEndFrame` sample position properties of the selection, for example:

```
{
"editSampleRate": 48000,
"editStartFrame":182360,
"editEndFrame":303934
}
```

or null values to remove the edit selection:

```
{
"editSampleRate": null,
"editStartFrame":null,
"editEndFrame":null
}
```


### Development server

Run `ng serve` for a development server.
Navigate to `http://localhost:4200/spr/session/2` start a demo recording session. 
Or edit/view a test recording file ID 1234 from the demo database:
`http://localhost:4200/spr/db/recordingfile/1234`

The app will automatically reload if you change any of the source files.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.


### Build module

Run `npm run build_module` to build the module. The build artifacts will be stored in the `dist/speechrecorderng` directory.


### Clean dist

Remove folder `dist`.

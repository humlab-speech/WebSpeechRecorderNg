import {TestBed} from '@angular/core/testing';
import {HttpClient, provideHttpClient} from "@angular/common/http";
import {HttpTestingController, provideHttpClientTesting} from "@angular/common/http/testing";
import {RecordingService} from "./recordings.service";
import {SPEECHRECORDER_CONFIG, SpeechRecorderConfig} from "../../spr.config";

describe('RecordingService.chunkStoredRequest', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;
    let service: RecordingService;

    beforeEach(() => {
        const cfg = new SpeechRecorderConfig();
        cfg.apiEndPoint = '';
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                {provide: SPEECHRECORDER_CONFIG, useValue: cfg},
                RecordingService
            ]
        });
        http = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
        service = TestBed.inject(RecordingService);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('resolves true when the server responds 2xx (chunk stored)', () => {
        let result = false;
        let completed = false;
        service.chunkStoredRequest('/api/recfile/uuid', 3).subscribe({
            next: (stored: boolean) => { result = stored; },
            complete: () => { completed = true; }
        });
        const req = httpMock.expectOne('/api/recfile/uuid/3');
        expect(req.request.method).toBe('GET');
        req.flush(new ArrayBuffer(8));
        expect(result).toBe(true);
        expect(completed).toBe(true);
    });

    it('resolves false when the server responds 404 (chunk not stored)', () => {
        let result = true;
        service.chunkStoredRequest('/api/recfile/uuid', 3).subscribe({
            next: (stored: boolean) => { result = stored; }
        });
        httpMock.expectOne('/api/recfile/uuid/3').flush(new ArrayBuffer(0), {status: 404, statusText: 'Not Found'});
        expect(result).toBe(false);
    });
});

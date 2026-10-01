import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from "@angular/common/http";
import {HttpTestingController, provideHttpClientTesting} from "@angular/common/http/testing";
import {ScriptPrefillService} from "./prefill.service";
import {ScriptService} from "./script.service";
import {SPEECHRECORDER_CONFIG, SpeechRecorderConfig} from "../../spr.config";
import {Group, PromptItem, Script, Section} from "./script";
import {PrefillSource} from "./prefill";
import {Session} from "../session/session";

function wordItem(): PromptItem {
  return {
    itemcode: "6", prerecdelay: 800, recduration: 30000,
    mediaitems: [{mimetype: "text/plain", text: "placeholder"}],
    prefill: {source: "sti-wordlists", select: "random", itemcodeFormat: "6.{n}", mediaitems: [{mimetype: "text/plain", text: "{entry}"}]}
  };
}

function sentenceItem(): PromptItem {
  return {
    itemcode: "7", prerecdelay: 800, recduration: 30000,
    mediaitems: [{mimetype: "text/plain", text: "placeholder"}],
    prefill: {source: "sti-sentencelists", select: "random", itemcodeFormat: "7.{n}", mediaitems: [{mimetype: "text/plain", text: "{entry}"}]}
  };
}

function linkedWordItem(): PromptItem {
  const item = wordItem();
  item.prefill = {...item.prefill!, link: "sti-lista"};
  return item;
}

function linkedSentenceItem(): PromptItem {
  const item = sentenceItem();
  item.prefill = {...item.prefill!, link: "sti-lista"};
  return item;
}

function scriptWith(items: Array<PromptItem>): Script {
  const group: Group = {promptItems: items, _shuffledPromptItems: []};
  const section: Section = {mode: "MANUAL", promptphase: "IDLE", training: false, groups: [group], _shuffledGroups: []};
  return {sections: [section]};
}

const SOURCE: PrefillSource = {
  lists: [
    {id: "l1", entries: ["apa","bil"]},
    {id: "l2", entries: ["hus","sol"]},
  ]
};

const SENTENCE_SOURCE: PrefillSource = {
  lists: [
    {id: "l1", entries: ["s1","s2"]},
    {id: "l2", entries: ["s3","s4"]},
  ]
};

function sessionWith(prefills: Record<string, {source: string, list: string}> | undefined): Session {
  return {sessionId: 9, status: "LOADED", type: "NORM", project: "Demo1", script: "demo", prefills};
}

describe('ScriptPrefillService', () => {
  let httpMock: HttpTestingController;
  let service: ScriptPrefillService;

  beforeEach(() => {
    const cfg = new SpeechRecorderConfig();
    cfg.apiEndPoint = '';
    cfg.apiType = null;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: SPEECHRECORDER_CONFIG, useValue: cfg},
        ScriptService,
        ScriptPrefillService
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ScriptPrefillService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('returns a script without prefill declarations unchanged and fetches nothing', () => {
    const script = scriptWith([{itemcode: "5", mediaitems: [{text: "hello"}]}]);
    let resolved: unknown = null;
    service.resolve(script, sessionWith(undefined)).subscribe({
      next: (value) => { resolved = value; }
    });
    expect(resolved).toEqual({script, choices: {}});
  });

  it('fetches the source, draws a random list and expands the placeholder', () => {
    spyOn(Math, 'random').and.returnValue(0.99);   // floor(0.99 * 2) = 1 -> l2
    const script = scriptWith([wordItem()]);
    let resolved: unknown = null;
    service.resolve(script, sessionWith(undefined)).subscribe({
      next: (value) => { resolved = value; }
    });
    const req = httpMock.expectOne('script/sti-wordlists');
    expect(req.request.method).toBe('GET');
    req.flush(SOURCE);

    const result = resolved as {script: Script, choices: Record<string, {source: string, list: string}>};
    expect(result.choices["6"]).toEqual({source: "sti-wordlists", list: "l2"});
    const items = result.script.sections[0].groups[0].promptItems;
    expect(items.length).toBe(2);
    expect(items[0].itemcode).toBe("6.1");
    expect(items[0].mediaitems[0].text).toBe("hus");
    expect(items[1].itemcode).toBe("6.2");
    expect(items[1].mediaitems[0].text).toBe("sol");
  });

  it('reuses the choice stored on the session instead of drawing a new list', () => {
    const script = scriptWith([wordItem()]);
    let resolved: unknown = null;
    service.resolve(script, sessionWith({"6": {source: "sti-wordlists", list: "l1"}})).subscribe({
      next: (value) => { resolved = value; }
    });
    httpMock.expectOne('script/sti-wordlists').flush(SOURCE);

    const result = resolved as {script: Script, choices: Record<string, {source: string, list: string}>};
    expect(result.choices["6"]).toEqual({source: "sti-wordlists", list: "l1"});
    expect(result.script.sections[0].groups[0].promptItems[0].mediaitems[0].text).toBe("apa");
  });

  it('redraws when the stored choice names a different source', () => {
    spyOn(Math, 'random').and.returnValue(0.99);
    const script = scriptWith([wordItem()]);
    let resolved: unknown = null;
    service.resolve(script, sessionWith({"6": {source: "other-source", list: "l1"}})).subscribe({
      next: (value) => { resolved = value; }
    });
    httpMock.expectOne('script/sti-wordlists').flush(SOURCE);

    const result = resolved as {script: Script, choices: Record<string, {source: string, list: string}>};
    expect(result.choices["6"]).toEqual({source: "sti-wordlists", list: "l2"});
  });

  it('errors when the source cannot be fetched', () => {
    const script = scriptWith([wordItem()]);
    let error: unknown = null;
    let completed = false;
    service.resolve(script, sessionWith(undefined)).subscribe({
      next: () => { completed = true; },
      error: (err) => { error = err; }
    });
    httpMock.expectOne('script/sti-wordlists').flush('not found', {status: 404, statusText: 'Not Found'});
    expect(error).toBeTruthy();
    expect(completed).toBeFalse();
  });

  it('draws the same list number for linked items and presents the two sets in order', () => {
    spyOn(Math, 'random').and.returnValue(0.99);   // floor(0.99 * 2) = 1 -> l2, for both sources
    const script = scriptWith([linkedWordItem(), linkedSentenceItem()]);
    let resolved: unknown = null;
    service.resolve(script, sessionWith(undefined)).subscribe({
      next: (value) => { resolved = value; }
    });
    httpMock.expectOne('script/sti-wordlists').flush(SOURCE);
    httpMock.expectOne('script/sti-sentencelists').flush(SENTENCE_SOURCE);

    const result = resolved as {script: Script, choices: Record<string, {source: string, list: string}>};
    expect(result.choices["6"]).toEqual({source: "sti-wordlists", list: "l2"});
    expect(result.choices["7"]).toEqual({source: "sti-sentencelists", list: "l2"});
    const items = result.script.sections[0].groups[0].promptItems;
    expect(items.map((i) => i.itemcode)).toEqual(["6.1", "6.2", "7.1", "7.2"]);
    expect(items.map((i) => i.mediaitems[0].text)).toEqual(["hus", "sol", "s3", "s4"]);
  });

  it('pairs a fresh linked sibling with an already-stored choice', () => {
    const script = scriptWith([linkedWordItem(), linkedSentenceItem()]);
    let resolved: unknown = null;
    service.resolve(script, sessionWith({"6": {source: "sti-wordlists", list: "l1"}})).subscribe({
      next: (value) => { resolved = value; }
    });
    httpMock.expectOne('script/sti-wordlists').flush(SOURCE);
    httpMock.expectOne('script/sti-sentencelists').flush(SENTENCE_SOURCE);

    const result = resolved as {script: Script, choices: Record<string, {source: string, list: string}>};
    expect(result.choices["6"]).toEqual({source: "sti-wordlists", list: "l1"});
    expect(result.choices["7"]).toEqual({source: "sti-sentencelists", list: "l1"});
  });

  it('keeps independently stored choices even when a linked pair disagrees', () => {
    const script = scriptWith([linkedWordItem(), linkedSentenceItem()]);
    let resolved: unknown = null;
    service.resolve(script, sessionWith({"6": {source: "sti-wordlists", list: "l1"}, "7": {source: "sti-sentencelists", list: "l2"}})).subscribe({
      next: (value) => { resolved = value; }
    });
    httpMock.expectOne('script/sti-wordlists').flush(SOURCE);
    httpMock.expectOne('script/sti-sentencelists').flush(SENTENCE_SOURCE);

    const result = resolved as {script: Script, choices: Record<string, {source: string, list: string}>};
    expect(result.choices["6"]).toEqual({source: "sti-wordlists", list: "l1"});
    expect(result.choices["7"]).toEqual({source: "sti-sentencelists", list: "l2"});
  });

});

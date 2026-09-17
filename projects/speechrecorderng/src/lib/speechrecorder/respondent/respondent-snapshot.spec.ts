import {buildRespondentSnapshot, signalName, signalState} from "./respondent-snapshot";
import {State as StartStopSignalState} from "../startstopsignal/startstopsignal";
import {PromptItem} from "../script/script";

describe('respondent snapshot', () => {

  const prompt: PromptItem = {
    itemcode: 'sens_1',
    recinstructions: {recinstructions: 'Please read the sentence aloud'},
    mediaitems: [
      {mimetype: 'text/x-prompt', promptDoc: {body: {blocks: [{type: 'p', texts: [{type: 'text', text: 'Der Wind'}]}]}}},
    ],
  };

  it('names the start/stop signal and maps the name back', () => {
    for (const state of [StartStopSignalState.IDLE, StartStopSignalState.PRERECORDING,
      StartStopSignalState.POSTRECORDING, StartStopSignalState.RECORDING, StartStopSignalState.OFF]) {
      expect(signalState(signalName(state))).toBe(state);
    }
  });

  it('carries the stage the mirror renders', () => {
    const snapshot = buildRespondentSnapshot({
      sessionId: '2',
      projectName: 'demo',
      itemIndex: 3,
      itemCount: 12,
      instruction: 'Please read the sentence aloud',
      showPrompt: true,
      prompt,
      signal: StartStopSignalState.RECORDING,
      ended: false,
      scheme: 'dark',
    });

    expect(snapshot.itemIndex).toBe(3);
    expect(snapshot.itemCount).toBe(12);
    expect(snapshot.instruction).toBe('Please read the sentence aloud');
    expect(snapshot.signal).toBe('RECORDING');
    expect(snapshot.ended).toBe(false);
    expect(snapshot.scheme).toBe('dark');
  });

  it('survives the transfer to the other window as plain data', () => {
    const snapshot = buildRespondentSnapshot({
      sessionId: '2', projectName: null, itemIndex: 0, itemCount: 1, instruction: null,
      showPrompt: false, prompt, signal: StartStopSignalState.IDLE, ended: false,
    });

    const transferred = JSON.parse(JSON.stringify(snapshot));
    expect(transferred.prompt.mediaitems[0].promptDoc.body.blocks[0].texts[0].text).toBe('Der Wind');
    expect(transferred.showPrompt).toBe(false);
    expect(signalState(transferred.signal)).toBe(StartStopSignalState.IDLE);
    expect(transferred.scheme).toBeNull();
  });
});

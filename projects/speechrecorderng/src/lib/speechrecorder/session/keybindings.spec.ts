import {collidingBinding, isEditableTarget, KEY, KEY_BINDINGS, keyLabel} from "./keybindings";

describe('keybindings', () => {

  function keyEvent(target: EventTarget | null, key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {key});
    Object.defineProperty(event, 'target', {value: target});
    return event;
  }

  it('exposes the respondent display as a binding', () => {
    const binding = KEY_BINDINGS.find((b) => b.key === KEY.RESPONDENT);
    expect(binding).toBeDefined();
    expect(binding!.descriptionKey).toBe('spr.keybinding.respondent');
    expect(keyLabel(KEY.RESPONDENT)).toBe(binding!.label);
  });

  it('recognises fields the operator types into', () => {
    expect(isEditableTarget(keyEvent(document.createElement('input'), 'd'))).toBe(true);
    expect(isEditableTarget(keyEvent(document.createElement('textarea'), 'd'))).toBe(true);
    expect(isEditableTarget(keyEvent(document.createElement('select'), 'd'))).toBe(true);
    expect(isEditableTarget(keyEvent(document.body, 'd'))).toBe(false);
  });

  it('reports a configured key that is already taken by another shortcut', () => {
    expect(collidingBinding(KEY.FORWARD)).toBeDefined();
    expect(collidingBinding('F9')).toBeUndefined();
    // the action's own default is not a clash with itself
    expect(collidingBinding(KEY.RESPONDENT, KEY.RESPONDENT)).toBeUndefined();
  });
});

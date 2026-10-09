// Planted for bin/editor_lint.mjs rule 7: Web Audio in the editor, where capture belongs to the recorder
// (D-G) and the editor's audition player uses an HTMLMediaElement instead.
const planted = new AudioContext();
console.log(typeof planted);

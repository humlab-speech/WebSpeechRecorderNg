// Planted for bin/editor_lint.mjs rule 8: a declaration of a name the library's script model already exports.
// The editor is meant to re-export the model rather than keep a copy, so this is the shape a silent divergence
// between what the editor saves and what the recorder reads would take.
export interface Section {
  name: string;
}

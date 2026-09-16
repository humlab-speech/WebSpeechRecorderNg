import {buildSpectrumLut, SPR_SPECTRUM_RAMP} from './theme';

/** WCAG relative luminance of an RGB triple. */
function luminance(rgb: number[]): number {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

const lutColor = (lut: Uint8Array, index: number): number[] =>
  [lut[index * 3], lut[index * 3 + 1], lut[index * 3 + 2]];

describe('spectrogram colour ramp', () => {

  it('is monotonic in luminance from quiet to loud', () => {
    // Spectral intensity must stay readable as brightness: a dip would make a louder
    // frame render darker than a quieter one. The interpolation is linear in light, so
    // the only deviation is the 8-bit round trip — allow one quantisation step.
    const oneQuantisationStep = 0.0005;
    const lut = buildSpectrumLut();
    let previous = -1;
    for (let i = 0; i < 256; i++) {
      const current = luminance(lutColor(lut, i));
      expect(current).withContext('luminance at ramp step ' + i)
        .toBeGreaterThanOrEqual(previous - oneQuantisationStep);
      previous = current;
    }
  });

  it('spans the ramp stops at the table ends', () => {
    const lut = buildSpectrumLut();
    const hex = (rgb: number[]) => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
    expect(lut.length).toBe(256 * 3);
    expect(hex(lutColor(lut, 0))).toBe(SPR_SPECTRUM_RAMP[0].toLowerCase());
    expect(hex(lutColor(lut, 255))).toBe(SPR_SPECTRUM_RAMP[SPR_SPECTRUM_RAMP.length - 1].toLowerCase());
  });
});

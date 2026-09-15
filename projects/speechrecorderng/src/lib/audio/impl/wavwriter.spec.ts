import {SampleSize, WavWriter} from "./wavwriter";

describe('WavWriter', () => {

    function audioBuffer(sampleRate: number, channels: number, length: number): AudioBuffer {
        return new AudioBuffer({length: length, numberOfChannels: channels, sampleRate: sampleRate});
    }

    // The data chunk of a 16-bit PCM WAV starts after the 44 byte canonical header
    // (RIFF 12 + fmt 24 + data header 8; no fact chunk for PCM).
    function readInt16(wav: Uint8Array, sampleIdx: number): number {
        const dv = new DataView(wav.buffer, 44);
        return dv.getInt16(sampleIdx * 2, true);
    }

    it('clamps out-of-range samples instead of wrapping them', () => {
        const ab = audioBuffer(44100, 1, 3);
        ab.getChannelData(0).set([1.1, -1.1, 0.5]);

        const ww = new WavWriter(false, SampleSize.INT16);
        const wav = ww.write(ab);

        expect(readInt16(wav, 0)).toBe(32767);
        expect(readInt16(wav, 1)).toBe(-32768);
        expect(readInt16(wav, 2)).toBe(16384);
    });

    it('writes in-range samples unchanged', () => {
        const ab = audioBuffer(44100, 2, 2);
        // interleaved stereo: (ch0, ch1) per frame
        ab.getChannelData(0).set([0.25, -0.75]);
        ab.getChannelData(1).set([0.5, -0.25]);

        const ww = new WavWriter(false, SampleSize.INT16);
        const wav = ww.write(ab);

        expect(readInt16(wav, 0)).toBe(Math.round(0.25 * 32768));
        expect(readInt16(wav, 1)).toBe(Math.round(0.5 * 32768));
        expect(readInt16(wav, 2)).toBe(Math.round(-0.75 * 32768));
        expect(readInt16(wav, 3)).toBe(Math.round(-0.25 * 32768));
    });
});

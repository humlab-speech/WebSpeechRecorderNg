import {Float32ArrayChunkerOutStream, Float32ArrayOutStream} from "./stream";

describe('Float32ArrayChunkerOutStream', () => {

    function captureStream(): {stream: Float32ArrayOutStream, written: Array<Array<Float32Array>>} {
        const written = new Array<Array<Float32Array>>();
        const stream: Float32ArrayOutStream = {
            write(buffers: Array<Float32Array>): number {
                written.push(buffers);
                return buffers.length > 0 ? buffers[0].length : 0;
            },
            flush(): void {
                // nothing to do
            },
            close(): void {
                // nothing to do
            }
        };
        return {stream, written};
    }

    it('copies all channels even when the channel count exceeds the frame count', () => {
        const {stream, written} = captureStream();
        const chunker = new Float32ArrayChunkerOutStream(stream);
        chunker.channels = 8;
        chunker.chunkSize = 4;

        const channels = 8;
        const frames = 4;
        const buffers = new Array<Float32Array>(channels);
        for (let ch = 0; ch < channels; ch++) {
            buffers[ch] = new Float32Array(frames);
            for (let f = 0; f < frames; f++) {
                buffers[ch][f] = ch * 100 + f;
            }
        }
        chunker.write(buffers);

        expect(written.length).toBe(1);
        const out = written[0];
        expect(out.length).toBe(channels);
        // channels >= frame count must not be dropped
        for (let ch = 0; ch < channels; ch++) {
            for (let f = 0; f < frames; f++) {
                expect(out[ch][f]).toBe(ch * 100 + f);
            }
        }
    });

    it('flushes a partial final chunk', () => {
        const {stream, written} = captureStream();
        const chunker = new Float32ArrayChunkerOutStream(stream);
        chunker.channels = 2;
        chunker.chunkSize = 4;

        const buffers = new Array<Float32Array>(2);
        buffers[0] = new Float32Array([1, 2, 3]);
        buffers[1] = new Float32Array([4, 5, 6]);
        chunker.write(buffers);
        chunker.flush();

        expect(written.length).toBe(1);
        expect(written[0][0]).toEqual(new Float32Array([1, 2, 3]));
        expect(written[0][1]).toEqual(new Float32Array([4, 5, 6]));
    });
});

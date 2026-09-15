import { WavFileFormat } from './wavformat'
import { BinaryByteWriter } from '../../io/BinaryWriter'
import {WorkerHelper} from "../../utils/utils";
import {SprLogger} from "../../utils/logger";
declare function postMessage (message:any, transfer:Array<any>):void;


export enum SampleSize {INT16=16,INT32=32}
   export class WavWriter {

     static readonly DEFAULT_SAMPLE_SIZE:SampleSize = SampleSize.INT16;
     private readonly sampleSizeInBytes:number=WavWriter.DEFAULT_SAMPLE_SIZE.valueOf()/8;
     private encodingFloat:boolean=false;
     private sampleSize=WavWriter.DEFAULT_SAMPLE_SIZE;
     private sampleSizeInBits=this.sampleSize.valueOf();
     private bw:BinaryByteWriter;
     // Shared encoder worker: a single worker and blob URL are reused for all WAV encodings.
     // Jobs are dispatched by id, so parallel writeAsync/writeAsyncPlanar calls stay ordered.
     private static workerURL: string|null=null;
     private static worker: Worker|null=null;
     private static jobSeq: number=0;
     private static pendingJobs: Map<number, (wavFileData:ArrayBuffer)=>void> = new Map<number, (wavFileData:ArrayBuffer)=>void>();

     constructor(encodingFloat?:boolean,sampleSize?:SampleSize) {
       //console.debug("WavWriter: "+encodingFloat+", "+sampleSize);
       if(encodingFloat!==undefined && encodingFloat!==null){
         this.encodingFloat=encodingFloat;
         if(encodingFloat===true) {
           this.sampleSize = SampleSize.INT32;
         }else{
           if(sampleSize) {
             this.sampleSize = sampleSize;
           }
         }
       }else if(sampleSize){
         this.sampleSize=sampleSize;
       }
       this.sampleSizeInBits=this.sampleSize.valueOf();
       this.sampleSizeInBytes=Math.round(this.sampleSizeInBits/8);

       this.bw = new BinaryByteWriter();
     }

     /*
      *  Method used as worker code.
      */
     static workerFunction() {
       self.onmessage = function (msg:MessageEvent) {

         const valView = new DataView(msg.data.buf,msg.data.bufPos);
         const sampleSizeInbytes=Math.round(msg.data.sampleSizeInBits/8);
         let bufPos = 0;
         const hDynIntRange = 1 << (msg.data.sampleSizeInBits - 1);
         for (let s = 0; s < msg.data.frameLength; s++) {
           // interleaved channel data

           for (let ch = 0; ch < msg.data.chs; ch++) {
             const srcPos=(ch*msg.data.frameLength)+s;
             const valFlt = msg.data.audioData[srcPos];
             if(msg.data.encodingFloat===true){
               valView.setFloat32(bufPos,valFlt,true);
               bufPos+=4;
             }else {
               // Clamp to the target range: out-of-range floats (e.g. clipped input >1.0)
               // would wrap around in setInt16/setInt32 and corrupt the sample.
               const valClamped = Math.min(1, Math.max(-1, valFlt));
               const valInt = Math.min(hDynIntRange - 1, Math.max(-hDynIntRange, Math.round(valClamped * hDynIntRange)));
               if (msg.data.sampleSizeInBits === 32) {
                 valView.setInt32(bufPos, valInt, true);
               } else {
                 valView.setInt16(bufPos, valInt, true);
               }
               bufPos+=sampleSizeInbytes;
             }

           }
         }
         postMessage({buf:msg.data.buf,id:msg.data.id}, [msg.data.buf]);
         //self.close()
       }
     }


     writeFmtChunk(chs:number,sampleRate:number){

       if(this.encodingFloat===true){
         this.bw.writeUint16(WavFileFormat.WAVE_FORMAT_IEEE_FLOAT, true);
       }else {
         this.bw.writeUint16(WavFileFormat.PCM, true);
       }
       const frameSize=this.sampleSizeInBytes*chs;
       this.bw.writeUint16(chs,true);
       this.bw.writeUint32(sampleRate,true);
         // dwAvgBytesPerSec
       this.bw.writeUint32(frameSize*sampleRate,true);
       this.bw.writeUint16(frameSize,true);
       // sample size in bits (PCM format only)
       this.bw.writeUint16(this.sampleSizeInBits,true);
       if(this.encodingFloat===true){
         this.bw.writeUint16(0,true);
       }
     }

     writeFactChunk(frameLen:number){
       let sampleLen=frameLen;
        this.bw.writeUint32(sampleLen,true);
     }

     writeDataChunk(audioBuffer:AudioBuffer){

       const chData0=audioBuffer.getChannelData(0);
       const dataLen=chData0.length;
       if(this.encodingFloat===true){
         for (let s = 0; s < dataLen; s++) {
           // interleaved channel data
           for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
             const chData = audioBuffer.getChannelData(ch);
             const valFlt = chData[s];
             this.bw.writeFloat(valFlt);
           }
         }
       }else {
         const hDynIntRange = 1 << ((this.sampleSizeInBits) - 1);
         for (let s = 0; s < dataLen; s++) {
           // interleaved channel data
           for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
             const chData = audioBuffer.getChannelData(ch);
             const valFlt = chData[s];
             // Clamp to the target range: out-of-range floats (e.g. clipped input >1.0)
             // would wrap around in writeInt16/writeInt32 and corrupt the sample.
             const valClamped = Math.min(1, Math.max(-1, valFlt));
             const valInt = Math.min(hDynIntRange - 1, Math.max(-hDynIntRange, Math.round(valClamped * hDynIntRange)));
             if (this.sampleSize === SampleSize.INT16) {
               this.bw.writeInt16(valInt, true);
             } else if (this.sampleSize === SampleSize.INT32) {
               this.bw.writeInt32(valInt, true);
             }
           }
         }
       }

     }

     writeChunkHeader(name:string,chkLen:number){
       this.bw.writeAscii(name);
       this.bw.writeUint32(chkLen,true);
     }

    writeAsync(audioBuffer:AudioBuffer,callback: (wavFileData:ArrayBuffer)=> void){

      const chs = audioBuffer.numberOfChannels;
      const frameLength = chs>0?audioBuffer.getChannelData(0).length:0;
      const channelData = new Array<Float32Array>(chs);
      for (let ch = 0; ch < chs; ch++) {
        channelData[ch]=audioBuffer.getChannelData(ch);
      }
      this.writeAsyncPlanar(chs,audioBuffer.sampleRate,frameLength,channelData,callback);
    }

    // Encode planar (per channel) float data without an intermediate AudioBuffer.
    writeAsyncPlanar(channels:number,sampleRate:number,frameLength:number,channelData:Array<Float32Array>,callback: (wavFileData:ArrayBuffer)=> void): void{
      const dataChkByteLen=this.writeHeaderParams(channels,sampleRate,frameLength);

      // interleave the planar channel data for the encoder
      const ad = new Float32Array(channels * frameLength);
      for (let ch = 0; ch < channels; ch++) {
        if (channelData[ch]) {
          ad.set(channelData[ch].subarray(0, frameLength), ch * frameLength);
        }
      }
      // ensureCapacity blocks !!!
      this.bw.ensureCapacity(dataChkByteLen);

      if (!WavWriter.workerURL) {
        WavWriter.workerURL = WorkerHelper.buildWorkerBlobURL(WavWriter.workerFunction);
      }
      if (!WavWriter.worker) {
        WavWriter.worker = new Worker(WavWriter.workerURL);
        WavWriter.worker.onmessage = (me) => {
          const msgData = me.data;
          if (msgData !== null && typeof msgData === 'object' && 'id' in msgData && typeof msgData.id === 'number' && 'buf' in msgData && msgData.buf instanceof ArrayBuffer) {
            const job = WavWriter.pendingJobs.get(msgData.id);
            if (job) {
              WavWriter.pendingJobs.delete(msgData.id);
              job(msgData.buf);
            }
          }
        };
      }
      const jobId = ++WavWriter.jobSeq;
      WavWriter.pendingJobs.set(jobId, callback);
      WavWriter.worker.postMessage({encodingFloat:this.encodingFloat,sampleSizeInBits:this.sampleSizeInBits, chs: channels, frameLength: frameLength, audioData: ad,buf:this.bw.buf,bufPos:this.bw.pos,id:jobId}, [ad.buffer,this.bw.buf]);

    }

     write(audioBuffer:AudioBuffer):Uint8Array{
       this.writeHeader(audioBuffer);
       this.writeDataChunk(audioBuffer);
       return this.bw.finish();
     }


      writeHeader(audioBuffer:AudioBuffer):number{
        return this.writeHeaderParams(audioBuffer.numberOfChannels,audioBuffer.sampleRate,audioBuffer.numberOfChannels>0?audioBuffer.getChannelData(0).length:0);
      }

      private writeHeaderParams(abChs:number,sampleRate:number,frameLen:number):number{
        this.bw.writeAscii(WavFileFormat.RIFF_KEY);
        let dataChkByteLen=frameLen*this.sampleSizeInBytes*abChs;

        let headerCnts=3; //Wave,fmt and data

        let fmtChunkSize=16;
        let factChunkSize=4;
        if(this.encodingFloat===true){
          fmtChunkSize=18;
          headerCnts++; // fact
        }// Float encoding requires fmt extension (with zero length)
        let wavChunkByteLen=(4+4)*headerCnts;

        wavChunkByteLen+=fmtChunkSize;
        wavChunkByteLen+=factChunkSize;
        wavChunkByteLen+=dataChkByteLen;

        SprLogger.debug("Write WAV header: Wav chunk len: "+wavChunkByteLen);
        this.bw.writeUint32(wavChunkByteLen,true); // must be set to file length-8 later
        this.bw.writeAscii(WavFileFormat.WAV_KEY);

        this.writeChunkHeader('fmt ',fmtChunkSize);
        this.writeFmtChunk(abChs,sampleRate);
        if(this.encodingFloat===true){
          SprLogger.debug("Write WAV header: Write 'fact' chunk.");
          this.writeChunkHeader('fact',4);
          this.writeFactChunk(frameLen);
        }
        this.writeChunkHeader('data',dataChkByteLen);
        return dataChkByteLen;
      }

   }




#!/usr/bin/env node

const fs = require('fs');
const WavDecoder = require("wav-decoder");
const parseOptions = require("./parseOptions");
const targetClock = require("./targetClock");

// $0000-000B: File signature "C64-TAPE-RAW"
// $000C:      TAP version $00 - Original layout, $01 - Updated
// 000D-000F:  Future expansion
// 0010-0013:  32 bit File data size  (not including header)
// 0014-xxxx:  File data

function data2tap(data) {
    let signature = "C64-TAPE-RAW";
    let version = 1;

    let tap = [];

    // add signature
    signature.split("").forEach(e=>tap.push(e.charCodeAt(0)));

    // add version
    tap.push(version);

    // add expansion
    tap.push(0x00);
    tap.push(0x00);
    tap.push(0x00);

    // add data size
    tap.push((data.length >>  0) & 0xFF);
    tap.push((data.length >>  8) & 0xFF);
    tap.push((data.length >> 16) & 0xFF);
    tap.push((data.length >> 24) & 0xFF);

    data.forEach(e=>tap.push(e));

    return new Uint8Array(tap);
}

// formulas for conversion between samples and tap bytes:
// pulse length (in seconds) = (8 * data byte) / (clock cycles)
// nsamples = (8 * data) / (clock * samplerate)
// data = (clock * samplerate) * nsamples / 8
// version 1: cycles = nsamples/(samplerate*clock)
//            nsamples = (samplerate*clock) / cycles;

function wav2data(samples, samplerate, clock) {
    let data = [];

    let counter = 0;
    for(let i=0;i<samples.length-1;i++) {
        // raising edge detect
        if(samples[i]<0 && samples[i+1]>=0) {
            let taplen = Math.round(((counter/samplerate) * clock) / 8);
            if(taplen < 256) {
                data.push(taplen);
            }
            else {
                let cycles = Math.round(((counter/samplerate) * clock));
                data.push(0x00);
                data.push((cycles >>  0) & 0xFF);
                data.push((cycles >>  8) & 0xFF);
                data.push((cycles >> 16) & 0xFF);
            }
            counter = 0;
        }
        else counter++;
    }
    return data;
}

////////////////////////////////////////////////////////////////////////////////////////

const options = parseOptions([
    { name: 'input', alias: 'i', type: String },
    { name: 'output', alias: 'o', type: String },
    { name: 'target', alias: 't', type: String },
    { name: 'invert', type: Boolean },
 ]);

if(options.input === undefined || options.output === undefined) {
    console.log("usage: wav2tap -i inputfile.wav -o outputfile.tap [-t target] [--invert]");
    console.log("         -t or --target target   C64PAL (default");
    console.log("         --invert                inverts the polarity of the audio samples");
    process.exit(-1);
}

let wavfile = fs.readFileSync(options.input);
let audioData = WavDecoder.decode.sync(wavfile);
let samples = audioData.channelData[0];

// invert audio amplitude if --invert option is given
if(options.invert) samples = samples.map(s=>-s);

let samplerate = audioData.sampleRate;
let clock = targetClock(options.target);

let data = wav2data(samples, samplerate, clock);
let tapfile = data2tap(data);
let tapName = options.output;

fs.writeFileSync(tapName, tapfile);
console.log(`file "${tapName}" generated`);


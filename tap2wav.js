#!/usr/bin/env node

const fs = require('fs');
const WavEncoder = require("wav-encoder");
const parseOptions = require("./parseOptions");
const targetClock = require("./targetClock");
const { getTapData, tapData2Cycles } = require("./tap");

// turns the TAP data block into samples at the desideres samplerate
// returns the array of float samples
//
function tap2wav(tapfile, samplerate, clock, invert) {
    let data = getTapData(tapfile);
    let cycles = tapData2Cycles(data);

    let samples = [];
    let volume = (invert === true) ? -0.75 : 0.75;

    for(let i=0;i<cycles.length;i++) {
        let nsamples = Math.round((cycles[i] * samplerate) / clock);
        for(let t=0;t<nsamples;t++) {
            if(t<nsamples/2) samples.push(volume);
            else             samples.push(-volume);
        }
    }
    return samples;
}

// turns the samples into an actual WAV file
// returns the array of bytes to be written to file
function samples2wavfile(samples, samplerate) {
    const wavData = {
        sampleRate: samplerate,
        channelData: [ new Float32Array(samples) ]
    };
    const buffer = WavEncoder.encode.sync(wavData, { bitDepth: 16, float: false });
    return Buffer.from(buffer)
}

//

const options = parseOptions([
    { name: 'input', alias: 'i', type: String },
    { name: 'output', alias: 'o', type: String },
    { name: 'samplerate', alias: 's', type: Number },
    { name: 'target', alias: 't', type: String },
    { name: 'invert', type: Boolean },
 ]);

if(options.input === undefined || options.output === undefined) {
    console.log("usage: tap2wav -i inputfile.tap -o outputfile.wav [-s samplerate] [-t target] [--invert]");
    console.log("         -s or --samplerate num  the samplerate of the output WAV file (44100 default)");
    console.log("         -t or --target target   C64PAL (default");
    console.log("         --invert                inverts the polarity of the audio samples");
    process.exit(-1);
}

let samplerate = options.samplerate == undefined ? 44100 : options.samplerate;
let invert = options.invert;
let clock = targetClock(options.target);
let tapfile = fs.readFileSync(options.input);
let samples = tap2wav(tapfile, samplerate, clock, invert);
let wavName = options.output;
let wavfile = samples2wavfile(samples,samplerate);

fs.writeFileSync(wavName, wavfile);
console.log(`file "${wavName}" generated`);

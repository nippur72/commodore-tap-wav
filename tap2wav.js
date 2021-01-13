#!/usr/bin/env node

const fs = require('fs');
const WavEncoder = require("wav-encoder");
const parseOptions = require("./parseOptions");
const targetClock = require("./targetClock");

// extract the data block from a V1 tap file
// returns the data block array
// throws if the file isn't a V1 TAP C64 tap file
//
function extract_data(tapfile) {
    let signature = [];
    for(let t=0;t<0x000C;t++) signature.push(String.fromCharCode(tapfile[t]));
    signature = signature.join("");
    if(signature != "C64-TAPE-RAW") throw `invalid signature "${signature}"`;

    let version = tapfile[0xC];
    if(version > 1) throw `invalid version ${version}`;

    let size =
        (tapfile[0x10] << 0)  |
        (tapfile[0x11] << 8)  |
        (tapfile[0x12] << 16) |
        (tapfile[0x13] << 24);

    tapdata = tapfile.slice(0x14);

    if(tapdata.length != size) throw `size doesn't match ${size} != ${tapdata.length}`;
    return tapdata;
}

// turns the TAP data block into samples at the desideres samplerate
// returns the array of float samples
//
function tap2wav(tapfile, samplerate, clock, invert) {
    let data = extract_data(tapfile);

    let samples = [];

    let volume = (invert === true) ? -0.75 : 0.75;

    for(let i=0;i<data.length;i++) {
        let byte = data[i];
        let nsamples = 0;

        if(byte !== 0) {
            // version 0 pulse
            // pulse length (in seconds) = (8 * data byte) / (clock cycles)
            nsamples = (8 * byte * samplerate) / clock;
        }
        else {
            // version 1 pulse
            let cycles =
                (data[i+1] << 0 )  |
                (data[i+2] << 8 )  |
                (data[i+3] << 16)  ;
            i+=3;
            nsamples = (cycles * samplerate) / clock;
        }
        for(let t=0;t<nsamples/2;t++) samples.push(volume);
        for(let t=0;t<nsamples/2;t++) samples.push(-volume);
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


#!/usr/bin/env node

const fs = require('fs');
const WavEncoder = require("wav-encoder");
const parseOptions = require("./parseOptions");
const targetClock = require("./targetClock");
const { getTapData, tapData2Cycles } = require("./tap");
const tap = require('./tap');

let buckets = new Array(255).fill(0);

function tapstat(tapfile) {
    let data = getTapData(tapfile);
    let cycles = tapData2Cycles(data);

    for(let i=0;i<cycles.length;i++) {
        let tapbyte = Math.round(cycles[i]/8);
        if(tapbyte<255) buckets[tapbyte]++;
    }

    console.log("pulse,occurences");
    buckets.forEach((e,i)=>{
        console.log(`${i},${e}`);
    });
}

const options = parseOptions([
    { name: 'input', alias: 'i', type: String },
 ]);

if(options.input === undefined) {
    console.log("Tapstat outputs how many times a pulse occurs in a .TAP file");
    console.log("It's used to determine the machine/clock speed the TAP file was produced.");
    console.log("The pulse is given in CPU cycles divided by 8 (as per TAP file format).");
    console.log("Ispect the console output directly or import into a spreadsheet.");
    console.log("");
    console.log("usage: tapstat -i inputfile.tap");
    console.log("");
    process.exit(-1);
}

let tapfile = fs.readFileSync(options.input);
tapstat(tapfile);


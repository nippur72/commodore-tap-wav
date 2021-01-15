// extract the data block from a V1 tap file
// returns the data block array
// throws if the file isn't a V1 TAP C64 tap file
//
function getTapData(tapfile) {
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

//
// convert a TAP data block into an array of pulses in terms of CPU cycles
//
function tapData2Cycles(data){
    let cycles = [];

    for(let i=0;i<data.length;i++) {
        let byte = data[i];
        let ncycles;

        if(byte !== 0) {
            // version 0 pulse: the data bytes is the number of CPU cycles divided by 8
            ncycles = 8 * byte;
        }
        else {
            // version 1 pulse: 3 bytes for the number of cpu_cycles
            ncycles =
                (data[i+1] << 0 )  |
                (data[i+2] << 8 )  |
                (data[i+3] << 16)  ;
            i+=3;
        }
        cycles.push(ncycles);
    }
    return cycles;
}

module.exports = { tapData2Cycles, getTapData };

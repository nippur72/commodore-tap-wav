const CLOCK = 985248; // C64 clock

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

    tap.push(...data);

    console.log(tap);

    return new Uint8Array(tap);
}

// formulas for conversion between samples and tap bytes:
// pulse length (in seconds) = (8 * data byte) / (clock cycles)
// nsamples = (8 * data) / (clock * samplerate)
// data = (clock * samplerate) * nsamples / 8
// version 1: cycles = nsamples/(samplerate*clock)
//            nsamples = (samplerate*clock) / cycles;

function wav2tap(samples, samplerate) {
    let data = [];

    let counter = 0;
    for(let i=0;i<samples.length-1;i++) {
        // raising edge detect
        if(samples[i]<0 && samples[i]>=0) {
            let taplen = counter * CLOCK * samplerate / 8;
            if(taplen < 256) {
                data.push(taplen);
            }
            else {
                let cycles = Math.round(counter / (samplerate * CLOCK));
                data.push(0x00);
                data.push((cycles >>  0) & 0xFF);
                data.push((cycles >>  8) & 0xFF);
                data.push((cycles >> 16) & 0xFF);
            }
        }
        else counter++;
    }
    return data;
}

let tap = data2tap([1,2,3]);

console.log(tap);


# commodore-tap.wav

Utility for encoding/decoding WAV files into TAP files for the Commodore Computers (C64, VIC20 ecc..).

`wav2tap` takes a .WAV file and produces a .TAP file.
`tap2wav` does the opposite, takes a .TAP file and generates a .WAV file.

# Installation

You must have [Node.js](https://nodejs.org) installed. From the command prompt:

```
npm i -g commodore-tap-wav
```

# Examples

```
tap2wav -i hello.tap -o hello.wav
waw2tap -i hello.wav -o hello1.tap
```



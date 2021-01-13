function targetClock(target) {
         if(target === undefined)   return 985248;
    else if(target === "C64PAL")    return 985248;
    else if(target === "C64NTSC")   return 1022727;
    else if(target === "VIC20PAL")  return 1108404;
    else if(target === "VIC20NTSC") return 1022727;
    else if(target === "C16PAL")    return 886724;
    else if(target === "C16NTSC")   return 894886;
    else throw `target "${target}" not supported`
}

module.exports = targetClock;

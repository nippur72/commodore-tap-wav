function targetClock(target) {
         if(target === undefined) return 985248;
    else if(target === "C64PAL")  return 985248;
    else throw `target "${target}" not supported`
}

module.exports = targetClock;

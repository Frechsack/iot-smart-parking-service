function calculatePrice(from, to) {
    const milis = to.getTime() - from.getTime();
    const secs = milis / 1000;
    const mins = secs / 60;
    const remainder = mins % 60;
    const hours = parseInt((mins / 60).toFixed(0));
    let priceaddon;
    if(remainder > 1) {
    priceaddon = 1;

}else {
    priceaddon = 0;
}

return hours * 1 + priceaddon;
}


console.log(calculatePrice(new Date(2020, 9, 6, 15, 10), new Date(2020, 9, 6, 23, 25)) == 9);
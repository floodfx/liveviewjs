"use strict";
exports.__esModule = true;
exports.numberToCurrency = void 0;
function numberToCurrency(amount) {
    var formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });
    return formatter.format(amount);
}
exports.numberToCurrency = numberToCurrency;

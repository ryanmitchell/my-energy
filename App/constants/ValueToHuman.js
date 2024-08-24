import * as React from 'react';

export function ValueToHuman(value) {
    let sign = value > 0 ? '' : '-';

    value = Math.abs(value);

    if (value > 1000000) {
      return sign + (value / 1000000).toFixed(1) + 'MWh';
    }

    if (value > 1000) {
      return sign + (value / 1000).toFixed(1) + 'kWh';
    }

    return sign + (value / 1).toFixed(1) + 'Wh';
};

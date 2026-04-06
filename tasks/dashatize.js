export function dashatize(n) {
  if (typeof n !== 'number' || isNaN(n) || !isFinite(n)) return '';
  if (!Number.isInteger(n)) return '';

  const absValue = Math.abs(n);
  const str = absValue.toString();
  let result = '';

  for (let i = 0; i < str.length; i++) {
    const digit = parseInt(str[i], 10);
    if (digit % 2 !== 0) {
      if (i !== 0 && result[result.length - 1] !== '-') result += '-';
      result += digit;
      if (i !== str.length - 1) result += '-';
    } else {
      result += digit;
    }
  }
  return result;
}
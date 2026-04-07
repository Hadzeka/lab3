
export function countInversions(arr) {
  if (!Array.isArray(arr)) return 0;
  
  let inversions = 0;
  
  function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    
    return merge(left, right);
  }
  
  function merge(left, right) {
    const result = [];
    let i = 0, j = 0;
    
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) {
        result.push(left[i]);
        i++;
      } else {
        // Если left[i] > right[j], то все оставшиеся элементы в left образуют инверсии с right[j]
        inversions += left.length - i;
        result.push(right[j]);
        j++;
      }
    }
    
    return result.concat(left.slice(i)).concat(right.slice(j));
  }
  
  mergeSort([...arr]); // копируем массив, чтобы не изменять оригинал
  return inversions;
}
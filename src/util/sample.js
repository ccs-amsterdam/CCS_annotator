export const drawRandom = (array, n, replace, keep_order) => {
  if (array.length === n && !replace && keep_order) return array;

  if (n == null || n === null || n > array.length) n = array.length;
  let index = [...Array(array.length).keys()];

  if (replace) {
    let out = [];
    for (let i = 0; i < n; i++) {
      out.push(index[Math.floor(Math.random() * index.length)]);
    }
    index = out;
  } else {
    index = getRandomSubarray(index, n < index.length ? n : index.length);
  }
  if (keep_order)
    index = index.sort(function (a, b) {
      return a - b;
    });
  return index.map((i) => array[i]);
};

//from: https://stackoverflow.com/questions/11935175/sampling-a-random-subset-from-an-array
const getRandomSubarray = (arr, size) => {
  var shuffled = arr.slice(0),
    i = arr.length,
    min = i - size,
    temp,
    index;
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }

  return shuffled.slice(min);
};

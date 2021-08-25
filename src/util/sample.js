export const drawRandom = (array, n, replace) => {
  console.log(n);
  if (replace) {
    let out = [];
    for (let i = 0; i < n; i++) {
      out.push(array[Math.floor(Math.random() * array.length)]);
    }
    return out;
  } else {
    return getRandomSubarray(array, n < array.length ? n : array.length);
  }
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
  console.log(arr);
  console.log(size);
  console.log(shuffled.slice(min));
  return shuffled.slice(min);
};

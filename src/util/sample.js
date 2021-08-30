import seedrandom from "seedrandom";

export const drawRandom = (array, n, replace, seed, group) => {
  const random = seedrandom(seed);

  if (n == null || n === null || n > array.length) n = array.length;
  let index = [...Array(array.length).keys()];

  let indices, ns;
  if (group === null) {
    indices = [index];
    ns = [n];
  } else {
    indices = splitIndex(index, group);
    ns = distributeN(indices, n);
  }

  let out = [];

  for (let j = 0; j < indices.length; j++) {
    if (replace) {
      for (let i = 0; i < n; i++) {
        out.push(indices[j][Math.floor(random() * ns[j])]);
      }
    } else {
      indices[j] = getRandomSubarray(
        indices[j],
        ns[j] < indices[j].length ? ns[j] : indices[j].length,
        random
      );
      for (let i of indices[j]) out.push(i);
    }
  }

  return out.map((i) => array[i]);
};

//from: https://stackoverflow.com/questions/11935175/sampling-a-random-subset-from-an-array
const getRandomSubarray = (arr, size, random) => {
  var shuffled = arr.slice(0),
    i = arr.length,
    min = i - size,
    temp,
    index;
  while (i-- > min) {
    index = Math.floor((i + 1) * random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }

  return shuffled.slice(min);
};

const splitIndex = (index, group) => {
  // index and group must be of same length
  const indices = [];
  const groupOb = {};

  for (let i = 0; i < index.length; i++) {
    if (groupOb[group[i]] == null) {
      groupOb[group[i]] = indices.length;
      indices.push([]);
    }
    indices[groupOb[group[i]]].push(index[i]);
  }
  return indices;
};

const distributeN = (indices, n) => {
  const ns = new Array(indices.length).fill(0);
  let full = new Array(indices.length).fill(0);
  let remain = n;
  let remainIndices = indices.length;
  let i = -1;

  while (remain > 0) {
    i++;
    let select = i % indices.length;
    if (full[select] !== 1) {
      ns[select]++;
      remain--;
      if (ns[select] === indices[select].length) {
        full[select] = 1;
        remainIndices--;
      }
    }
    if (remainIndices === 0) break;
  }
  return ns;
};

/**
 *
 * @param {*} arr An array of objects that each has a .ref key
 * @param {*} selected
 */
export const moveUp = (arr, selected, xposition = null) => {
  // given an array of refs for buttons (or any divs), and the current selected button,
  // move to most overlapping button on previous row
  // (basically, what you want to happen when you press 'up' in a grid of buttons)
  const currentPos = getPosition(arr[selected].ref, arr?.[xposition]?.ref);
  let correctRow = null;
  let prevColOverlap = 0;
  for (let i = selected - 1; i >= 0; i--) {
    if (arr[i].ref == null || arr[i].ref.current === null) return i + 1;
    const nextPos = getPosition(arr[i].ref);

    if (correctRow === null) {
      if (sameRow(currentPos, nextPos)) continue;
      correctRow = nextPos; // set correct row once we reach a button on the next row
    } else {
      if (!sameRow(correctRow, nextPos)) return i + 1;
    }

    const colOverlap = calcColOverlap(currentPos, nextPos);
    //if (colOverlap > 0.5) return i;
    if (prevColOverlap > 0 && colOverlap < prevColOverlap) return i + 1;
    if (currentPos.left > nextPos.right) return i;

    prevColOverlap = colOverlap;
  }

  return 0;
};

/**
 *
 * @param {*} arr An array of objects that each has a .ref key
 * @param {*} selected
 */
export const moveDown = (arr, selected, xposition = null) => {
  // like moveUp, but down
  const currentPos = getPosition(arr[selected].ref, arr?.[xposition]?.ref);
  let correctRow = null;
  let prevColOverlap = 0;
  for (let i = selected + 1; i < arr.length; i++) {
    if (arr[i].ref == null || arr[i].ref.current === null) return i - 1;

    const nextPos = getPosition(arr[i].ref);

    if (correctRow === null) {
      if (sameRow(currentPos, nextPos)) continue;
      correctRow = nextPos; // set correct row once we reach a button on the next row
    } else {
      if (!sameRow(correctRow, nextPos)) return i - 1;
    }

    const colOverlap = calcColOverlap(currentPos, nextPos);
    //if (colOverlap > 0.5) return i;
    if (prevColOverlap > 0 && colOverlap < prevColOverlap) return i - 1;
    if (currentPos.right < nextPos.left) return i;
    prevColOverlap = colOverlap;
  }

  return arr.length - 1;
};

const sameRow = (a, b) => {
  // we can't just check if y positions are the same, because they fool around a bit
  // so instead we look at how much buttons overlap on the y axis

  const lowestTop = Math.max(a.top, b.top); // lowest top of two buttons on screen
  const highestBottom = Math.min(a.bottom, b.bottom); // highest bottom of two buttons on screen

  const overlap = highestBottom - lowestTop;
  // if buttons overlap more than 50% of height of box a, say they overlap
  // (really, boxes on the same row will overlap > 99%, so this is very safe)
  return overlap > 0.5 * a.height;
};

const calcColOverlap = (a, b) => {
  const rightestLeft = Math.max(a.left, b.left);
  const leftestRight = Math.min(a.right, b.right);

  const pctA = (leftestRight - rightestLeft) / a.width;
  const pctB = (leftestRight - rightestLeft) / b.width;
  return Math.max(pctA, pctB);
};

const getPosition = (ref, horizontalRef) => {
  if (!ref) return null;
  const pos = ref.current.getBoundingClientRect();

  if (horizontalRef != null) {
    const hpos = horizontalRef.current.getBoundingClientRect();
    pos.x = hpos.x;
    pos.width = hpos.width;
  }
  return pos;
};

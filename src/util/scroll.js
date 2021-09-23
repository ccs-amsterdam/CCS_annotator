// custom scrollintoview

export const scrollToMiddle = (parent, child, position) => {
  // scroll parent to position of child
  // position should be value between 0 and 1 for relative position between top (0) and bottom (1)
  const parentBounding = parent.getBoundingClientRect();
  const clientBounding = child.getBoundingClientRect();

  const parentTop = parentBounding.top;
  const parentHeight = parentBounding.height;
  const clientTop = clientBounding.top;
  const topToCenter = parentHeight / (1 / position); // position 1/4 down from top

  parent.scrollTop = parent.scrollTop + clientTop - (topToCenter + parentTop);
};

export const keepInView = (parent, child) => {
  // scroll parent to position of child
  // position should be value between 0 and 1 for relative position between top (0) and bottom (1)

  const parentBounding = parent.getBoundingClientRect();
  const clientBounding = child.getBoundingClientRect();

  const parentTop = parentBounding.top;
  const parentHeight = parentBounding.height;
  const clientTop = clientBounding.top;

  const needUp = clientTop - parentTop < 50;
  const needDown = clientTop > parentTop + parentHeight * 0.9;

  //if (needUp > 0) parent.scrollTop = parent.scrollTop + needUp;
  if (needDown) {
    parent.scrollTop = parent.scrollTop + clientTop - (parentHeight * 0.9 + parentTop);
  }
  if (needUp) {
    parent.scrollTop = parent.scrollTop + clientTop - (parentHeight * 0.1 + parentTop);
  }
};

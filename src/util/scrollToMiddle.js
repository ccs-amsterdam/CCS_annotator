// custom scrollintoview

const scrollToMiddle = (parent, child, position) => {
  // scroll parent to position of child
  // position should be value between 0 and 1 for relative position between top (0) and bottom (1)
  const parentBounding = parent.getBoundingClientRect();
  const clientBounding = child.getBoundingClientRect();

  const parentTop = parentBounding.top;
  const clientTop = clientBounding.top;

  const topToCenter = parentBounding.height / (1 / position); // position 1/4 down from top

  parent.scrollTop = parent.scrollTop + clientTop - (topToCenter + parentTop);
};

export default scrollToMiddle;

export const blockEvents = (block) => {
  return {
    type: "BLOCK_EVENTS",
    block,
  };
};

export const setFullScreenNode = (node) => {
  return {
    type: "SET_FULL_SCREEN_NODE",
    node,
  };
};

export const setMode = (mode) => {
  return {
    type: "SET_MODE",
    mode: mode,
  };
};

export const resetDB = () => {
  return {
    type: "RESET_DB",
  };
};

export const blockEvents = (block) => {
  return {
    type: "BLOCK_EVENTS",
    block,
  };
};

export const selectCodingjob = (codingjob) => {
  return {
    type: "SELECT_CODINGJOB",
    codingjob,
  };
};

export const setCodingjobs = (codingjobs) => {
  return {
    type: "SET_CODINGJOBS",
    codingjobs,
  };
};

export const setCurrentToken = (index) => {
  return {
    type: "SET_CURRENT_TOKEN",
    index,
  };
};

export const toggleTokenSelection = (tokens, index, add) => {
  return {
    type: "TOGGLE_TOKEN_SELECTION",
    tokens,
    index,
    add,
  };
};

export const clearTokenSelection = () => {
  return {
    type: "CLEAR_TOKEN_SELECTION",
  };
};

export const triggerCodeselector = (from, tokenIndex, code) => {
  return {
    type: "TRIGGER_CODESELECTOR",
    from: from,
    index: tokenIndex,
    code: code,
  };
};

export const setAnnotations = (spanAnnotation) => {
  return {
    type: "SET_ANNOTATIONS",
    spanAnnotation,
  };
};

export const toggleAnnotations = (spanAnnotation) => {
  return {
    type: "TOGGLE_ANNOTATIONS",
    spanAnnotation,
  };
};

export const rmAnnotations = (spanAnnotation) => {
  return {
    type: "RM_ANNOTATIONS",
    spanAnnotation,
  };
};

export const clearSpanAnnotations = () => {
  return {
    type: "CLEAR_SPAN_ANNOTATIONS",
  };
};

export const setCodeMap = (codes) => {
  return {
    type: "SET_CODE_MAP",
    codes,
  };
};

export const resetCodeHistory = () => {
  return {
    type: "RESET_CODE_HISTORY",
  };
};

export const appendCodeHistory = (code, n = 20) => {
  return {
    type: "APPEND_CODE_HISTORY",
    code,
    n,
  };
};

export const setShowSidebar = (show) => {
  return {
    type: "SET_SHOW_SIDEBAR",
    show,
  };
};

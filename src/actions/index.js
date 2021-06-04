export const resetDB = () => {
  return {
    type: "RESET_DB",
  };
};

export const blockEvents = (block) => {
  return {
    type: "BLOCK_EVENTS",
    payload: block,
  };
};

export const selectCodingjob = (codingjob) => {
  return {
    type: "SELECT_CODINGJOB",
    payload: codingjob,
  };
};

export const setCodingjobs = (codingjobs) => {
  return {
    type: "SET_CODINGJOBS",
    payload: codingjobs,
  };
};

export const setCodingjobSettings = (codingjobSettings) => {
  return {
    type: "SET_CODINGJOB_SETTINGS",
    payload: codingjobSettings,
  };
};

export const setTokenIndices = (tokenIndices) => {
  return {
    type: "SET_TOKEN_INDICES",
    payload: tokenIndices,
  };
};

export const setCurrentToken = (index) => {
  return {
    type: "SET_CURRENT_TOKEN",
    payload: index,
  };
};

export const toggleTokenSelection = (tokens, index, add) => {
  return {
    type: "TOGGLE_TOKEN_SELECTION",
    payload: { tokens, index, add },
  };
};

export const setTokenSelection = (tokenSelection) => {
  return {
    type: "SET_TOKEN_SELECTION",
    payload: tokenSelection,
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
    payload: spanAnnotation,
  };
};

export const toggleAnnotations = (spanAnnotation) => {
  return {
    type: "TOGGLE_ANNOTATIONS",
    payload: spanAnnotation,
  };
};

export const rmAnnotations = (spanAnnotation) => {
  return {
    type: "RM_ANNOTATIONS",
    payload: spanAnnotation,
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
    payload: codes,
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
    payload: { code: code, n: n },
  };
};

export const setShowSidebar = (show) => {
  return {
    type: "SET_SHOW_SIDEBAR",
    payload: show,
  };
};

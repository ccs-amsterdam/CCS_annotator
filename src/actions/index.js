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

export const triggerCodeselector = (from, unit, index, code) => {
  return {
    type: "TRIGGER_CODESELECTOR",
    from: from,
    unit: unit,
    index: index,
    code: code,
  };
};

export const setAnnotations = (annotations) => {
  return {
    type: "SET_ANNOTATIONS",
    annotations,
  };
};

/**
 * Add one specific annotation, or replace or delete existing annotation
 * @param {string} unit  Whether the annotation is a document, paragraph, sentence or span annotation
 * @param {number} index The index of the unit. (document is always 0)
 * @param {string} group The unique annotation group
 * @param {object} annotation The annotation. If null, deletes the current annotation
 * @returns
 */
export const toggleAnnotation = (unit, index, group, annotation) => {
  return {
    type: "TOGGLE_ANNOTATION",
    unit,
    index,
    group,
    annotation,
  };
};

export const toggleSpanAnnotations = (spanAnnotation) => {
  return {
    type: "TOGGLE_SPAN_ANNOTATIONS",
    spanAnnotation,
  };
};

export const rmSpanAnnotations = (spanAnnotation) => {
  return {
    type: "RM_SPAN_ANNOTATIONS",
    spanAnnotation,
  };
};

export const clearAnnotations = () => {
  return {
    type: "CLEAR_ANNOTATIONS",
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

export const setItemSettings = (itemSettings) => {
  return {
    type: "SET_ITEM_SETTINGS",
    itemSettings,
  };
};

export const setShowSidebar = (show) => {
  return {
    type: "SET_SHOW_SIDEBAR",
    show,
  };
};

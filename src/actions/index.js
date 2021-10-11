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

export const setMoveUnitIndex = (where) => {
  return {
    type: "SET_MOVE_UNIT_INDEX",
    where,
  };
};

export const setFullScreenNode = (node) => {
  return {
    type: "SET_FULL_SCREEN_NODE",
    node,
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

export const triggerCodeselector = (index, code, selection) => {
  return {
    type: "TRIGGER_CODESELECTOR",
    index,
    code,
    selection,
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

export const setQuestionIndex = (questionIndex) => {
  return {
    type: "SET_QUESTION_INDEX",
    questionIndex,
  };
};

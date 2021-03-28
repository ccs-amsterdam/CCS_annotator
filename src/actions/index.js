export const setDB = (db) => {
  return {
    type: "SET_DB",
    payload: db,
  };
};

export const resetDB = () => {
  return {
    type: "RESET_DB",
  };
};

export const setDropbox = (dropbox) => {
  return {
    type: "SET_DROPBOX",
    payload: dropbox,
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

export const selectDocument = (document) => {
  return {
    type: "SELECT_ARTICLE",
    payload: document,
  };
};

export const setDocuments = (document) => {
  return {
    type: "SET_DOCUMENTS",
    payload: document,
  };
};

export const setTokenIndices = (tokenIndices) => {
  return {
    type: "SET_TOKEN_INDICES",
    payload: tokenIndices,
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

export const setCodes = (codes) => {
  return {
    type: "SET_CODES",
    payload: codes,
  };
};

export const appendCodeHistory = (code, n = 5) => {
  return {
    type: "APPEND_CODE_HISTORY",
    payload: { code: code, n: n },
  };
};

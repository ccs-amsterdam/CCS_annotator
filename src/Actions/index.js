export const createAmcatSession = (Amcat) => {
  return {
    type: "CREATE_AMCAT_SESSION",
    payload: Amcat,
  };
};

export const deleteAmcatSession = () => {
  return {
    type: "DELETE_AMCAT_SESSION",
  };
};

export const selectAmcatIndex = (index) => {
  return {
    type: "SELECT_AMCAT_INDEX",
    payload: index,
  };
};

export const setAmcatIndices = (indices) => {
  return {
    type: "SET_AMCAT_INDICES",
    payload: indices,
  };
};

export const selectArticle = (article) => {
  return {
    type: "SELECT_ARTICLE",
    payload: article,
  };
};

export const setArticles = (articles) => {
  return {
    type: "SET_ARTICLES",
    payload: articles,
  };
};

export const toggleAnnotations = (spanAnnotation) => {
  return {
    type: "TOGGLE_ANNOTATIONS",
    payload: spanAnnotation,
  };
};

export const clearSpanAnnotations = () => {
  return {
    type: "CLEAR_SPAN_ANNOTATIONS",
  };
};

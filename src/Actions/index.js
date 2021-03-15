export const createSession = (sessionInstance) => {
  return {
    type: "CREATE_SESSION",
    payload: sessionInstance,
  };
};

export const deleteSession = () => {
  return {
    type: "DELETE_SESSION",
  };
};

export const selectIndex = (index) => {
  return {
    type: "SELECT_INDEX",
    payload: index,
  };
};

export const setIndices = (indices) => {
  return {
    type: "SET_INDICES",
    payload: indices,
  };
};

export const setArticles = (articles) => {
  return {
    type: "SET_ARTICLES",
    payload: articles,
  };
};

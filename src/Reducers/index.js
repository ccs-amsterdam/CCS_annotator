import { combineReducers } from "redux";

const amcat = (state = null, action) => {
  switch (action.type) {
    case "CREATE_AMCAT_SESSION":
      return action.payload;
    case "DELETE_AMCAT_SESSION":
      return null;
    default:
      return state;
  }
};

const amcatIndex = (state = null, action) => {
  switch (action.type) {
    case "SELECT_AMCAT_INDEX":
      return action.payload;
    default:
      return state;
  }
};

const amcatIndices = (state = [], action) => {
  switch (action.type) {
    case "SET_AMCAT_INDICES":
      return action.payload;
    default:
      return state;
  }
};

const articles = (state = [], action) => {
  switch (action.type) {
    case "SET_ARTICLES":
      return action.payload;
    default:
      return state;
  }
};

const article = (state = [], action) => {
  switch (action.type) {
    case "SELECT_ARTICLE":
      return action.payload;
    default:
      return state;
  }
};

const spanAnnotations = (state = [], action) => {
  switch (action.type) {
    case "ADD_SPAN_ANNOTATION":
      return [...state, action.payload];
    case "RM_SPAN_ANNOTATION":
      return state.filter((o) => o.offset !== action.payload.offset);
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  amcat,
  amcatIndex,
  amcatIndices,
  article,
  articles,
  spanAnnotations,
});

export default rootReducer;

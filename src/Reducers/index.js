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

const amcatIndices = (state = null, action) => {
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

const rmAnnotations = (annotations, a) => {
  annotations[a.index] = annotations[a.index].filter((v) => v !== a.group);
  if (annotations[a.index].length === 0) annotations[a.index] = undefined;
  return annotations;
};

const toggleAnnotations = (annotations, annList, multiple = false) => {
  for (let key in annList) {
    let a = annList[key];
    if (annotations[a.index]) {
      if (multiple) {
        if (annotations[a.index].includes(a.group)) {
          annotations = rmAnnotations(annotations, a);
        } else {
          annotations[a.index].push(a.group);
        }
      } else {
        if (annotations[a.index].includes(a.group)) {
          annotations[a.index] = undefined;
        } else {
          annotations[a.index] = a;
        }
      }
    } else {
      annotations[a.index] = [a.group];
    }
  }
  console.log(annotations);
  return annotations;
};

const spanAnnotations = (state = {}, action) => {
  switch (action.type) {
    case "TOGGLE_ANNOTATIONS":
      return toggleAnnotations({ ...state }, action.payload);
    case "CLEAR_SPAN_ANNOTATIONS":
      return {};
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

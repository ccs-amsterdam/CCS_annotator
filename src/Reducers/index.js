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

const tokenIndices = (state = null, action) => {
  switch (action.type) {
    case "SET_TOKEN_INDICES":
      return action.payload;
    default:
      return state;
  }
};

// separately store the annotation in a more universal format and
// a format that is fast to use in the app. Now store universal format in state
// but in time figure out how to use indexedDb.

const toggleAnnotations = (annotations, annList, rm) => {
  for (let key in annList) {
    let a = annList[key];

    // if group in annotations, remove it
    if (annotations[a.index]) {
      if (annotations[a.index][a.group]) {
        const span = annotations[a.index][a.group].span;
        for (let i = span[0]; i <= span[1]; i++) {
          if (annotations[i]) {
            if (annotations[i][a.group]) {
              delete annotations[i][a.group];
              if (Object.keys(annotations[i]).length === 0) {
                delete annotations[i];
              }
            }
          }
        }
        // if selection was one token (which is probably a click),
        // just remove the annotation. But if it was a multi-token selection,
        // we do add the new selection
        if (a.span[0] === a.span[1]) continue;
      }
    }

    // if not, add it
    if (!rm) {
      if (!annotations[a.index]) annotations[a.index] = {};
      annotations[a.index][a.group] = {
        index: a.index,
        span: [a.span[0], a.span[1]],
        offset: a.offset,
        length: a.length,
      };
    }
  }

  return annotations;
};

const spanAnnotations = (state = {}, action) => {
  switch (action.type) {
    case "TOGGLE_ANNOTATIONS":
      return toggleAnnotations({ ...state }, action.payload, false);
    case "RM_ANNOTATIONS":
      return toggleAnnotations({ ...state }, action.payload);
    case "CLEAR_SPAN_ANNOTATIONS":
      return {};
    default:
      return state;
  }
};

const testCodes = [
  {
    key: "Mark Rutte",
    text: "Mark Rutte",
    value: "Mark Rutte",
    color: "#40a31f",
  },
  {
    key: "Sigrid Kaag",
    text: "Sigrid Kaag",
    value: "Sigrid Kaag",
    color: "#f2db5c",
  },
];

const codes = (state = testCodes, action) => {
  switch (action.type) {
    case "SET_CODES":
      return action.payload;
    default:
      return state;
  }
};

const codeHistory = (state = [], action) => {
  switch (action.type) {
    case "APPEND_CODE_HISTORY":
      let newstate = state
        .filter((v) => v !== action.payload.code)
        .slice(0, action.payload.n - 1);
      newstate.unshift(action.payload.code);
      console.log(newstate);
      return newstate;
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
  tokenIndices,
  spanAnnotations,
  codes,
  codeHistory,
});

export default rootReducer;

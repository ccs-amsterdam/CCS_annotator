import { combineReducers } from "redux";

const db = (state = null, action) => {
  switch (action.type) {
    case "SET_DB":
      return action.payload;
    case "RESET_DB":
      return null;
    default:
      return state;
  }
};

const eventsBlocked = (state = false, action) => {
  switch (action.type) {
    case "BLOCK_EVENTS":
      return action.payload;
    default:
      return state;
  }
};

const codingjob = (state = null, action) => {
  switch (action.type) {
    case "SELECT_CODINGJOB":
      return action.payload;
    case "RESET_DB":
      return null;
    default:
      return state;
  }
};

const codingjobs = (state = [], action) => {
  switch (action.type) {
    case "SET_CODINGJOBS":
      return action.payload;
    case "RESET_DB":
      return [];
    default:
      return state;
  }
};

const codingjobSettings = (state = {}, action) => {
  switch (action.type) {
    case "SET_CODINGJOB_SETTINGS":
      return action.payload;
    case "RESET_DB":
      return {};
    default:
      return state;
  }
};

const tokenIndices = (state = [], action) => {
  switch (action.type) {
    case "SET_TOKEN_INDICES":
      return action.payload;
    case "SELECT_DOCUMENT":
      return [];
    case "RESET_DB":
      return [];
    default:
      return state;
  }
};

const currentToken = (state = 0, action) => {
  switch (action.type) {
    case "SET_CURRENT_TOKEN":
      return action.payload;
    case "SELECT_DOCUMENT":
      return 0;
    case "RESET_DB":
      return 0;
    default:
      return state;
  }
};

const tokenSelection = (state = [], action) => {
  // an array of length 2, giving the start and end of the selection
  switch (action.type) {
    case "TOGGLE_TOKEN_SELECTION":
      return toggleSelection(
        state,
        action.payload.tokens,
        action.payload.index,
        action.payload.add
      );
    case "SET_TOKEN_SELECTION":
      return action.payload;
    case "CLEAR_TOKEN_SELECTION":
      return [];
    case "RESET_DB":
      return [];
    default:
      return state;
  }
};

const codeSelectorTrigger = (state = { from: null, index: null, code: null }, action) => {
  switch (action.type) {
    case "TRIGGER_CODESELECTOR":
      return { from: action.from, index: action.index, code: action.code };
    default:
      return state;
  }
};

const toggleSelection = (selection, tokens, index, add) => {
  if (!add || selection.length === 0) return [index, index];
  //if (selection[1] === index) return selection;

  if (tokens[selection[0]].section === tokens[index].section) return [selection[0], index];

  if (index > selection[0]) {
    for (let i = index; i >= selection[0]; i--) {
      if (tokens[selection[0]].section === tokens[i].section) return [selection[0], i];
    }
  } else {
    for (let i = index; i <= selection[0]; i++) {
      if (tokens[selection[0]].section === tokens[i].section) return [selection[0], i];
    }
  }
  return selection;
};

const spanAnnotations = (state = {}, action) => {
  switch (action.type) {
    case "TOGGLE_ANNOTATIONS":
      return toggleAnnotations({ ...state }, action.payload, false);
    case "RM_ANNOTATIONS":
      return toggleAnnotations({ ...state }, action.payload, true);
    case "CLEAR_SPAN_ANNOTATIONS":
      return {};
    case "RESET_DB":
      return {};
    default:
      return state;
  }
};

const toggleAnnotations = (annotations, annList, rm) => {
  for (let item in annList) {
    let a = annList[item];

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

    if (!rm) {
      if (!annotations[a.index]) annotations[a.index] = {};
      annotations[a.index][a.group] = {
        index: a.index,
        span: [a.span[0], a.span[1]],
        length: a.length,
        section: a.section,
        offset: a.offset,
      };
    }
  }
  return annotations;
};

const codeMap = (state = {}, action) => {
  switch (action.type) {
    case "SET_CODE_MAP":
      return action.payload;
    case "RESET_DB":
      return {};
    default:
      return state;
  }
};

const codeHistory = (state = [], action) => {
  switch (action.type) {
    case "APPEND_CODE_HISTORY":
      let newstate = state.filter(v => v !== action.payload.code).slice(0, action.payload.n - 1);
      newstate.unshift(action.payload.code);
      return newstate;
    case "RESET_DB":
      return [];
    default:
      return state;
  }
};

const showSidebar = (state = false, action) => {
  switch (action.type) {
    case "SET_SHOW_SIDEBAR":
      return action.payload;
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  db,
  eventsBlocked,
  codingjob,
  codingjobs,
  codingjobSettings,
  tokenIndices,
  currentToken,
  codeSelectorTrigger,
  tokenSelection,
  spanAnnotations,
  codeMap,
  codeHistory,
  showSidebar,
});

export default rootReducer;
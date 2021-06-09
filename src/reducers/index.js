import { combineReducers } from "redux";
import { toggleAnnotations } from "../util/annotations";

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
    case "SET_ANNOTATIONS":
      return action.payload;
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
    case "RESET_CODE_HISTORY":
      return [];
    case "APPEND_CODE_HISTORY":
      let newstate = state.filter((v) => v !== action.payload.code).slice(0, action.payload.n - 1);
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

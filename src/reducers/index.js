import { combineReducers } from "redux";
import { toggleAnnotation, toggleSpanAnnotations } from "../util/annotations";

const eventsBlocked = (state = false, action) => {
  switch (action.type) {
    case "BLOCK_EVENTS":
      return action.block;
    default:
      return state;
  }
};

const moveUnitIndex = (state = 0, action) => {
  // this simply triggers a rerender used to move to the previous or next unit
  // it increments to trigger rerender, with sign indicating direction
  switch (action.type) {
    case "SET_MOVE_UNIT_INDEX":
      switch (action.where) {
        case "next":
          return Math.abs(state) + 1;
        case "previous":
          return Math.abs(state) - 1;
        default:
          return state;
      }
    default:
      return state;
  }
};

const currentToken = (state = 0, action) => {
  switch (action.type) {
    case "SET_CURRENT_TOKEN":
      return action.index;
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
      return toggleSelection(state, action.tokens, action.index, action.add);
    case "CLEAR_TOKEN_SELECTION":
      return [];
    case "RESET_DB":
      return [];
    default:
      return state;
  }
};

const codeSelectorTrigger = (
  state = { from: null, unit: null, index: null, code: null },
  action
) => {
  switch (action.type) {
    case "TRIGGER_CODESELECTOR":
      return { from: action.from, unit: action.unit, index: action.index, code: action.code };
    default:
      return state;
  }
};

const toggleSelection = (selection, tokens, index, add) => {
  if (!add || selection.length === 0) return [index, index];

  // Negative offset for if token.index does not start at 0
  //let offset = -tokens[0].index;
  let offset = 0;

  if (tokens[selection[0] + offset].section === tokens[index + offset].section)
    return [selection[0], index];

  if (index > selection[0]) {
    for (let i = index; i >= selection[0]; i--) {
      if (tokens[selection[0] + offset].section === tokens[i + offset].section)
        return [selection[0], i];
    }
  } else {
    for (let i = index; i <= selection[0]; i++) {
      if (tokens[selection[0] + offset].section === tokens[i + offset].section)
        return [selection[0], i];
    }
  }
  return selection;
};

const emptyAnnotations = { document: {}, paragraph: {}, sentence: {}, span: {} };
const annotations = (state = { ...emptyAnnotations }, action) => {
  let span;
  switch (action.type) {
    case "SET_ANNOTATIONS":
      return action.annotations;
    case "TOGGLE_ANNOTATION":
      return toggleAnnotation(
        { ...state },
        action.unit,
        action.index,
        action.group,
        action.annotation
      );
    case "TOGGLE_SPAN_ANNOTATIONS":
      // token/span annotations require special function that also looks at the span to toggle
      span = toggleSpanAnnotations({ ...state.span }, action.spanAnnotation, false);
      return { ...state, span };
    case "RM_SPAN_ANNOTATIONS":
      span = toggleSpanAnnotations({ ...state.span }, action.spanAnnotation, true);
      return { ...state, span };
    case "CLEAR_ANNOTATIONS":
      return { ...emptyAnnotations };
    case "RESET_DB":
      return { ...emptyAnnotations };
    default:
      return state;
  }
};

const codeHistory = (state = [], action) => {
  switch (action.type) {
    case "RESET_CODE_HISTORY":
      return [];
    case "APPEND_CODE_HISTORY":
      let newstate = state.filter((v) => v !== action.code).slice(0, action.n - 1);
      newstate.unshift(action.code);
      return newstate;
    case "RESET_DB":
      return [];
    default:
      return state;
  }
};

const questionIndex = (state = 0, action) => {
  switch (action.type) {
    case "SET_QUESTION_INDEX":
      return action.questionIndex;
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  eventsBlocked,
  moveUnitIndex,
  currentToken,
  codeSelectorTrigger,
  tokenSelection,
  annotations,
  codeHistory,
  questionIndex,
});

export default rootReducer;

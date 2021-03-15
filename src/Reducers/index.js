import { combineReducers } from "redux";

const session = (state = null, action) => {
  switch (action.type) {
    case "CREATE_SESSION":
      return action.payload;
    case "DELETE_SESSION":
      return null;
    default:
      return state;
  }
};

const index = (state = null, action) => {
  switch (action.type) {
    case "SELECT_INDEX":
      return action.payload;
    default:
      return state;
  }
};

const indices = (state = [], action) => {
  switch (action.type) {
    case "SET_INDICES":
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

const rootReducer = combineReducers({
  session,
  index,
  indices,
  articles,
});

export default rootReducer;

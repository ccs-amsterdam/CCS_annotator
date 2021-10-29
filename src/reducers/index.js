import { combineReducers } from "redux";

const eventsBlocked = (state = false, action) => {
  switch (action.type) {
    case "BLOCK_EVENTS":
      return action.block;
    default:
      return state;
  }
};

const fullScreenNode = (state = null, action) => {
  switch (action.type) {
    case "SET_FULL_SCREEN_NODE":
      return action.node;
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  eventsBlocked,
  fullScreenNode,
});

export default rootReducer;

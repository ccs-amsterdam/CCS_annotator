import "semantic-ui-css/semantic.min.css";
import React from "react";
import ReactDOM from "react-dom";
import App from "App";
import { createStore } from "redux";
import rootReducer from "reducers";
import { Provider } from "react-redux";
import { CookiesProvider } from "react-cookie";

const store = createStore(rootReducer);

ReactDOM.render(
  <React.StrictMode>
    <CookiesProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </CookiesProvider>
  </React.StrictMode>,
  document.querySelector("#root")
);

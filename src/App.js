import React from "react";
import { HashRouter } from "react-router-dom";

// Main pages. Use below in items to include in header menu
import AnnotatorAPIClient from "components/AnnotatorAPIClient/AnnotatorAPIClient";

const App = () => {
  return (
    <HashRouter basename="/">
      <div style={{ height: "100vh", width: "100vw" }}>
        <AnnotatorAPIClient />
      </div>
    </HashRouter>
  );
};

export default App;

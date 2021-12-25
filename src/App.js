import React from "react";

// Main pages. Use below in items to include in header menu
import AnnotatorAPIClient from "components/AnnotatorAPIClient/AnnotatorAPIClient";

const App = () => {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <AnnotatorAPIClient />
    </div>
  );
};

export default App;

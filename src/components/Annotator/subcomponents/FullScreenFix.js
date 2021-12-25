import React, { useEffect, useState } from "react";
import { FullScreen } from "react-full-screen";

// This is due to a bug in react-full-screen
// https://github.com/Semantic-Org/Semantic-UI-React/issues/4191

// It's basically the workaround provided by layershifter, but using redux
// to make the ref available to the (very deeply nested) popup that needs it

const FullScreenFix = ({ handle, children, setFullScreenNode }) => {
  return (
    <FullScreen handle={handle}>
      <DOMNodeProvider setFullScreenNode={setFullScreenNode} style={{ height: "100%" }}>
        {(node) => {
          return children;
        }}
      </DOMNodeProvider>
    </FullScreen>
  );
};

const DOMNodeProvider = ({ children, setFullScreenNode }) => {
  const [node, setNode] = useState(null);

  useEffect(() => {
    setFullScreenNode(node);
    return () => {
      setFullScreenNode(null);
    };
  }, [node, setFullScreenNode]);

  return (
    <div className="dom-node-provider" ref={setNode}>
      {children(node)}
    </div>
  );
};

export default FullScreenFix;

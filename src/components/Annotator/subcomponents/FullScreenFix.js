import React, { useEffect, useState } from "react";
import { FullScreen } from "react-full-screen";
import { setFullScreenNode } from "actions";
import { useDispatch } from "react-redux";

// This is due to a bug in react-full-screen
// https://github.com/Semantic-Org/Semantic-UI-React/issues/4191

// It's basically the workaround provided by layershifter, but using redux
// to make the ref available to the (very deeply nested) popup that needs it

const FullScreenFix = ({ handle, children }) => {
  return (
    <FullScreen handle={handle}>
      <DOMNodeProvider>
        {(node) => {
          return children;
        }}
      </DOMNodeProvider>
      ;
    </FullScreen>
  );
};

const DOMNodeProvider = ({ children }) => {
  const [node, setNode] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setFullScreenNode(node));
    return () => {
      dispatch(setFullScreenNode(null));
    };
  }, [node, dispatch]);

  return (
    <div className="dom-node-provider" ref={setNode}>
      {children(node)}
    </div>
  );
};

export default FullScreenFix;

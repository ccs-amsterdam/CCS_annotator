import React from "react";

import { Button, Popup } from "semantic-ui-react";

const Help = ({ children, header, texts, type }) => {
  // a simple question mark popup for help texts
  // header should be a string
  // texts an array of strings (for different paragraphs)

  const questionMark = () => {
    return (
      <Button
        circular
        icon={type === "warn" ? "exclamation" : "question"}
        size="mini"
        style={{
          position: "absolute",
          marginTop: "-0.6em",
          marginLeft: "0.2em",
          paddingLeft: "0.1em",
          paddingRight: "0.1em",
          paddingTop: "0.2em",
          paddingBottom: "0.2em",
          background: type === "warn" ? "orange" : "white",
          color: "black",
          border: "1px solid grey",
        }}
      />
    );
  };

  return (
    <Popup position="right center" trigger={questionMark()}>
      {header ? <h3>{header}</h3> : null}
      {texts ? texts.map((text, i) => <p key={i}>{text}</p>) : null}
      {children}
    </Popup>
  );
};

export default Help;

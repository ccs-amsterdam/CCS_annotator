import React from "react";

import { Button, Popup } from "semantic-ui-react";

const Help = ({ header, texts }) => {
  // a simple question mark popup for help texts
  // header should be a string
  // texts an array of strings (for different paragraphs)

  const questionMark = () => {
    return (
      <Button
        circular
        size="mini"
        icon="question"
        style={{
          margin: "0",
          marginLeft: "0.5em",
          maxHeight: "1.5em",
          maxWidth: "1.5em",
          padding: "0.2em",
          background: "black",
          color: "white",
        }}
      />
    );
  };

  return (
    <Popup position="right center" trigger={questionMark()}>
      <h3>{header}</h3>
      {texts.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </Popup>
  );
};

export default Help;

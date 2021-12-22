import React, { useState, useEffect, useRef } from "react";
import { Button, Icon, Ref } from "semantic-ui-react";

import { moveDown, moveUp } from "library/refNavigation";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const ButtonSelection = ({ id, active, options, onSelect }) => {
  const [selected, setSelected] = useState(0);
  const [allOptions, setAllOptions] = useState([]);
  const deleted = useRef({});

  useEffect(() => {
    // add cancel button and (most importantly) add refs used for navigation
    const cancelOption = {
      cancel: true,
      label: "CLOSE",
      color: "grey",
      value: "CANCEL",
      textColor: "white",
    };

    let allOptions = [...options, cancelOption];
    for (let option of allOptions) option.ref = React.createRef();
    setAllOptions(allOptions);
  }, [options, setAllOptions]);

  const onKeydown = React.useCallback(
    (event) => {
      const nbuttons = allOptions.length;

      // any arrowkey
      if (arrowKeys.includes(event.key)) {
        event.preventDefault();

        if (event.key === "ArrowRight") {
          if (selected < nbuttons - 1) setSelected(selected + 1);
        }

        if (event.key === "ArrowDown") {
          setSelected(moveDown(allOptions, selected));
        }

        if (event.key === "ArrowLeft") {
          if (selected > 0) setSelected(selected - 1);
        }

        if (event.key === "ArrowUp") {
          setSelected(moveUp(allOptions, selected));
        }

        return;
      }

      // space or enter
      if (event.keyCode === 32 || event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();

        let value = allOptions[selected].value;
        onSelect(value, event.ctrlKey);
      }
    },
    [selected, allOptions, onSelect]
  );

  useEffect(() => {
    if (active) {
      window.addEventListener("keydown", onKeydown);
    } else {
      window.removeEventListener("keydown", onKeydown);
    }
    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, [active, onKeydown]);

  const button = (option, i) => {
    const textColor = option.value.delete ? "#682c2c" : "black";
    const tagColor = option.value.delete ? option.value : "white";
    const tagBorderColor = option.color.slice(0, 7);
    const borderColor = option.value.delete ? "darkred" : "black";
    const bgColor = option.color;

    return (
      <Ref innerRef={option.ref}>
        <Button
          style={{
            flex: `1 1 auto`,
            padding: "4px 2px",
            background: bgColor,
            color: textColor,
            border: "3px solid",
            borderColor: i === selected ? borderColor : "white",
            margin: "1px",
          }}
          key={option.label + "_" + i}
          value={option.value}
          compact
          size="mini"
          onMouseOver={() => setSelected(i)}
          onClick={(e, d) => onSelect(d.value, e.ctrlKey)}
        >
          {option.tag ? (
            <span
              style={{
                display: "inline-block",
                float: "left",
                background: tagColor,
                color: "black",
                borderRadius: "0px",
                border: `2px solid ${tagBorderColor}`,
                padding: "2px",
                margin: "-4px 4px -4px -2px",
              }}
            >{`${option.tag} `}</span>
          ) : null}
          <span>{option.label}</span>
        </Button>
      </Ref>
    );
  };

  const mapButtons = () => {
    let i = 0;
    let cancelButton;
    const selectButtons = [];
    const deleteButtons = [];
    for (let option of allOptions) {
      if (deleted.current[option.value]) continue;

      if (option.value === "CANCEL") cancelButton = button(option, i);
      else if (option.value.delete) deleteButtons.push(button(option, i));
      else selectButtons.push(button(option, i));

      i++;
    }

    return (
      <>
        <div key={id + "_1"} style={{ display: "flex", flexWrap: "wrap", marginBottom: "10px" }}>
          {selectButtons}
        </div>
        {deleteButtons.length > 0 ? (
          <b>
            <Icon name="trash alternate" /> Delete codes
          </b>
        ) : null}
        <div key={id + "_2"} style={{ display: "flex", flexWrap: "wrap" }}>
          {deleteButtons}
        </div>
        <div key={id + "_3"} style={{ display: "flex", flexWrap: "wrap" }}>
          {cancelButton}
        </div>
      </>
    );
  };

  return <div key={id}>{mapButtons()}</div>;
};

export default ButtonSelection;

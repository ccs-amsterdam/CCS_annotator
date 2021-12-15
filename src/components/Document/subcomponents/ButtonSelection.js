import React, { useState, useEffect, useRef } from "react";
import { Button, Icon, Ref } from "semantic-ui-react";
import { toggleSpanAnnotation } from "library/annotations";

import { moveDown, moveUp } from "library/refNavigation";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const ButtonSelection = ({
  id,
  active,
  options,
  setOpen,
  callback,
  setAnnotations, // deletable is an array of annotatins that can be deleted
}) => {
  const [selected, setSelected] = useState(0);
  const [allOptions, setAllOptions] = useState([]);
  const deleted = useRef({});

  console.log(selected);

  useEffect(() => {
    // add cancel button and (most importantly) add refs used for navigation
    let allOptions = [...options];
    allOptions.push({
      box2: true,
      label: "CANCEL",
      color: "grey",
      value: "CANCEL",
      textColor: "white",
    });

    for (let option of allOptions) option.ref = React.createRef();
    setAllOptions(allOptions);
  }, [options, setAllOptions]);

  const onClickDelete = React.useCallback(
    (value) => {
      if (value === "CANCEL") setOpen(false);
      if (typeof value === "object") {
        setAnnotations((state) => toggleSpanAnnotation({ ...state }, value, true));
        setOpen(false);
        return;
      }
    },
    [setAnnotations, setOpen]
  );

  const onClickSelect = React.useCallback(
    (value) => {
      callback(value);
    },
    [callback]
  );

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

      // delete
      if (event.keyCode === 46) callback(null);

      // space or enter
      if (event.keyCode === 32 || event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();

        let value = allOptions[selected].value;
        if (allOptions[selected].box2) {
          onClickDelete(value);
        } else {
          onClickSelect(value);
        }
      }
    },
    [selected, callback, allOptions, onClickDelete, onClickSelect]
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

  const button = (option, i, onClick) => {
    const bcolorSelected = option.icon === "trash alternate" ? "darkred" : "black";

    return (
      <Ref innerRef={option.ref}>
        <Button
          style={{
            flex: `1 1 auto`,
            padding: "4px 2px",
            background: option.color,
            color: option.textColor || "black",
            border: "3px solid",
            borderColor: i === selected ? bcolorSelected : "white",
            margin: "1px",
          }}
          key={option.label}
          value={option.value}
          compact
          size="mini"
          onMouseOver={() => setSelected(i)}
          onClick={(e, d) => onClick(d.value)}
        >
          {option.icon ? <Icon name={option.icon} /> : null}
          {option.tag ? (
            <span
              style={{
                display: "inline-block",
                float: "left",
                background: "#00000070",
                color: "white",
                borderRadius: "2px",
                padding: "2px",
                marginRight: "4px",
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
    const selectButtons = [];
    const deleteButtons = [];
    for (let option of allOptions) {
      if (deleted.current[option.value]) continue;
      if (option.box2) {
        deleteButtons.push(button(option, i, onClickDelete));
      } else {
        selectButtons.push(button(option, i, onClickSelect));
      }
      i++;
    }

    return (
      <>
        <div key={id + "1"} style={{ display: "flex", flexWrap: "wrap" }}>
          {selectButtons}
        </div>
        <div key={id + "2"} style={{ display: "flex", flexWrap: "wrap", marginTop: "10px" }}>
          {deleteButtons}
        </div>
      </>
    );
  };

  return <div key={id}>{mapButtons()}</div>;
};

export default ButtonSelection;

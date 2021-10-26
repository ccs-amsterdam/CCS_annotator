import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { blockEvents } from "actions";
import { textToCodes } from "util/codebook";
import { Button, ButtonGroup, Dropdown, Form, Input, Popup, TextArea } from "semantic-ui-react";

const EditCodePopup = ({ codeMap, code, codes, setCodes, toggleActiveCode, setChangeColor }) => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [popupContent, setPopupContent] = useState(null);

  useEffect(() => {
    dispatch(blockEvents(open));
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch, open]);

  const buttonStyle = {
    padding: "0",
    margin: "0",
    width: "15px",
    borderRadius: "0",
    minHeight: "10px",
  };

  const buttonContent = () => {
    if (code === "")
      return (
        <ButtonGroup fluid color="black">
          <Button content="Add codes" onClick={() => addCodePopup(true)} style={buttonStyle} />;
        </ButtonGroup>
      );
    return (
      <ButtonGroup color="black" attached fluid size="mini" style={{ padding: "0", margin: "0" }}>
        <Button
          size="mini"
          icon={code.active && code.activeParent ? "toggle on" : "toggle off"}
          onClick={() => toggleActiveCode(codes, code.code, !code.active, setCodes)}
          style={{ ...buttonStyle, color: code.active && code.activeParent ? "green" : "red" }}
        />
        {changeColorPopup()}

        <Button
          icon="plus"
          compact
          size="mini"
          onClick={() => addCodePopup(false)}
          style={buttonStyle}
        />
        <Button icon="minus" compact size="mini" onClick={rmCodePopup} style={buttonStyle} />
        <Button icon="edit" compact size="mini" onClick={moveCodePopup} style={buttonStyle} />

        <Button
          icon="arrow up"
          compact
          size="mini"
          onClick={() => changePosition("up")}
          style={buttonStyle}
        />
        <Button
          icon="arrow down"
          compact
          size="mini"
          onClick={() => changePosition("down")}
          style={buttonStyle}
        />
      </ButtonGroup>
    );
  };

  const changeColorPopup = () => {
    if (!code.code && code.active == null) return null;

    return (
      <Button
        size="mini"
        as={"Input"}
        style={{
          ...buttonStyle,
          padding: "10px 0px",
          background: code.color || "white",
        }}
        onInput={(e) => setChangeColor({ code: code.code, color: e.target.value })}
        type="color"
        value={code.color || "white"}
      />
    );
  };

  const addCodePopup = (root) => {
    setPopupContent(
      <AddCodePopup
        codeMap={codeMap}
        code={root ? "" : code.code}
        codes={codes}
        setCodes={setCodes}
        setOpen={setOpen}
      />
    );
    setOpen(true);
  };

  const rmCodePopup = () => {
    setPopupContent(
      <RmCodePopup
        codeMap={codeMap}
        code={code.code}
        codes={codes}
        setCodes={setCodes}
        setOpen={setOpen}
      />
    );
    setOpen(true);
  };

  const moveCodePopup = () => {
    setPopupContent(
      <MoveCodePopup
        codeMap={codeMap}
        code={code.code}
        codes={codes}
        setCodes={setCodes}
        setOpen={setOpen}
      />
    );
    setOpen(true);
  };

  const changePosition = (direction) => {
    movePosition(codes, code, direction, setCodes);
    setOpen(false);
  };

  return (
    <Popup
      inverted
      size="mini"
      flowing
      hoverable
      mouseLeaveDelay={99999999}
      open={open}
      onClose={() => setOpen(false)}
      trigger={buttonContent()}
      style={{ padding: "0", margin: "0" }}
    >
      {popupContent}
    </Popup>
  );
};

const movePosition = (codes, code, direction, setCodes) => {
  const a = codes.findIndex((c) => c.code === code.code); // position of selected code
  let b = null; // position of switchSibling

  const codeParent = codes[a].parent;
  for (let i = 0; i < codes.length; i++) {
    if (i === a) continue;
    if (codes[i].parent !== codeParent) continue;

    if (direction === "down") {
      if (i > a && (b === null || b > i)) b = i;
    }
    if (direction === "up") {
      if (i < a && (b === null || b < i)) b = i;
    }
  }
  if (b === null) return null;

  const newCodes = [...codes];
  const temp = newCodes[a];
  newCodes[a] = newCodes[b];
  newCodes[b] = temp;

  setCodes(newCodes);
};

const AddCodePopup = ({ codeMap, code, codes, setCodes, setOpen }) => {
  const [alreadyExists, setAlreadyExists] = useState([]);
  const [textInput, setTextInput] = useState("");

  const addCode = (text) => {
    if (text === "") return null;
    const [updatedCodes, duplicates] = textToCodes(text, code, codes);
    if (duplicates.length > 0) {
      setAlreadyExists(duplicates);
      return null;
    }
    setCodes(updatedCodes);
    setOpen(false);
  };

  return (
    <div style={{ margin: "1em", height: "200px" }}>
      <p>
        {code === "" ? (
          "Create new codes"
        ) : (
          <>
            Add codes under <b>{code}</b>
          </>
        )}
        <Button floated="right" compact size="mini" icon="delete" onClick={() => setOpen(false)} />
      </p>
      <Form onSubmit={() => addCode(textInput)}>
        <Popup
          open={alreadyExists.length > 0}
          trigger={
            <TextArea
              autoFocus
              onChange={(e, d) => {
                setTextInput(d.value);
                setAlreadyExists([]);
              }}
              value={textInput}
              style={{ height: "130px" }}
              placeholder="Every line becomes a new code"
            />
          }
        >
          Duplicate labels: <br />
          <b>{alreadyExists.join(", ")}</b>
        </Popup>
        <Button fluid content="Create" onClick={() => addCode(textInput)} />
      </Form>
    </div>
  );
};

const RmCodePopup = ({ codeMap, code, codes, setCodes, setOpen }) => {
  const rmCode = (keepChildren) => {
    let updatedCodes = codes.filter((ucode) => ucode.code !== code);

    const children = [];
    if (!keepChildren) {
      getAllChildren(codeMap, code, children);
      updatedCodes = updatedCodes.filter((ucode) => !children.includes(ucode.code));
    } else {
      updatedCodes = updatedCodes.map((ucode) => {
        if (codeMap[code].children.includes(ucode.code)) ucode.parent = codeMap[code].parent;
        return ucode;
      });
    }

    //const removeCodes = [code, ...children];

    setCodes(updatedCodes);
    setOpen(false);
  };

  return (
    <div style={{ margin: "1em" }}>
      <p>
        Delete <b>{code}</b>?
      </p>
      <ButtonGroup fluid>
        {codeMap[code].children.length > 0 ? (
          <>
            <Button color="red" onClick={() => rmCode(false)}>
              Yes
            </Button>
            <Button color="red" onClick={() => rmCode(true)}>
              Yes, but keep children
            </Button>
          </>
        ) : (
          <Button color="red" onClick={() => rmCode(true)}>
            Yes
          </Button>
        )}
        <Button onClick={() => setOpen(false)}>Cancel</Button>
      </ButtonGroup>
    </div>
  );
};

const MoveCodePopup = ({ codeMap, code, codes, setCodes, setOpen }) => {
  const [newParent, setNewParent] = useState(codeMap[code].parent);
  const [textInput, setTextInput] = useState(code);

  const parentOptions = ["ROOT", ...getAllParentOptions(codeMap, code)]; // fills parents array

  const mvCode = (newCode, newParent) => {
    if (newCode !== code) {
      if (newCode === "") return null;
      if (codeMap[newCode]) return null;
    }
    let codeIsNew = true; // if code was only a parent, it isn't yet in the edgelist
    let updatedCodes = codes.map((ucode) => {
      if (ucode.code === code) {
        ucode.code = newCode;
        ucode.parent = newParent;
        codeIsNew = false;
      }
      if (ucode.parent === code) {
        ucode.parent = newCode;
      }
      return ucode;
    });
    if (codeIsNew) codes.push({ code: newCode, parent: newParent, active: true });
    codes = codes.filter((code) => code.parent !== "ROOT");

    setCodes(updatedCodes);
    setOpen(false);
  };

  return (
    <div style={{ margin: "1em" }}>
      <p>
        Change parent and/or label
        <Button floated="right" compact size="mini" icon="delete" onClick={() => setOpen(false)} />
      </p>

      <Form onSubmit={() => mvCode(textInput, newParent)}>
        <Form.Field inline>
          <label style={{ color: "white" }}>Parent:</label>
          <Dropdown
            value={newParent}
            style={{ minWidth: "10em" }}
            options={parentOptions.map((parent, i) => {
              return {
                key: parent,
                value: parent,
                text: parent,
              };
            })}
            search
            selectOnNavigation={false}
            minCharacters={0}
            autoComplete={"on"}
            onChange={(e, d) => {
              setNewParent(d.value);
            }}
          />
        </Form.Field>
        <Form.Field inline>
          <label style={{ color: "white" }}>Code:</label>
          <Input
            autoFocus
            onChange={(e, d) => {
              setTextInput(d.value);
            }}
            value={textInput}
            placeholder="new code"
          />
        </Form.Field>
        <Button fluid onClick={() => mvCode(textInput, newParent)}>
          Change
        </Button>
      </Form>
    </div>
  );
};

const getAllChildren = (codeMap, code, children) => {
  for (const child of codeMap[code].children) {
    children.push(child);
    getAllChildren(codeMap, child, children);
  }
};

const getAllParentOptions = (codeMap, code) => {
  const children = [];
  getAllChildren(codeMap, code, children);
  return Object.keys(codeMap).filter((parent) => !children.includes(parent) && parent !== code);
};

export default EditCodePopup;

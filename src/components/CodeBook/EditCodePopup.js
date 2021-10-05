import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { blockEvents } from "actions";
import { Button, ButtonGroup, Dropdown, Form, Icon, Input, Popup } from "semantic-ui-react";

const EditCodePopup = ({ children, codeMap, code, codes, setCodes, setChangeColor }) => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [popupContent, setPopupContent] = useState(null);

  useEffect(() => {
    dispatch(blockEvents(open));
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch, open]);

  const buttonContent = () => {
    return (
      <ButtonGroup basic>
        {changeColorPopup()}
        <Button icon="plus" compact size="mini" onClick={() => addCodePopup(false)} />
        <Button icon="minus" compact size="mini" onClick={rmCodePopup} />
        <Button icon="edit" compact size="mini" onClick={moveCodePopup} />
        <Button icon="arrow up" compact size="mini" onClick={() => changePosition("up")} />
        <Button icon="arrow down" compact size="mini" onClick={() => changePosition("down")} />
      </ButtonGroup>
    );
  };

  const changeColorPopup = () => {
    if (!code.code && code.active == null) return null;
    return (
      <Button
        as={"Input"}
        style={{
          padding: "0",
          margin: "0",
          width: "2em",
          height: "2em",
          background: "white",
          color: code.color ? code.color : "white",
        }}
        onChange={(e) => setChangeColor({ code: code.code, color: e.target.value })}
        type="color"
        value={code.color}
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
  };

  const changePosition = (direction) => {
    movePosition(codes, code, direction, setCodes);
    setOpen(false);
  };

  return (
    <Popup
      flowing
      hoverable
      wide
      position="top right"
      onClose={() => {
        setPopupContent(buttonContent());
        setOpen(false);
      }}
      open={open}
      mouseLeaveDelay={10000000} // just don't use mouse leave
      style={{ padding: "0px" }}
      trigger={
        code === "" ? (
          <Button
            onClick={() => {
              addCodePopup(true);
              setOpen(true);
            }}
            style={{ marginTop: "1em", marginLeft: "1em" }}
            compact
            size="mini"
          >
            Add code
          </Button>
        ) : (
          <span
            onClick={() => {
              setPopupContent(buttonContent);
              setOpen(true);
            }}
          >
            {children}
          </span>
        )
      }
    >
      {popupContent}{" "}
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
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [textInput, setTextInput] = useState("");

  const addCode = (newCode) => {
    if (newCode === "") return null;
    if (codeMap[newCode]) {
      setAlreadyExists(true);
      return null;
    }

    const updatedCodes = [...codes];
    updatedCodes.push({ code: newCode, parent: code, active: true });
    setCodes(updatedCodes);
    setOpen(false);
  };

  return (
    <div style={{ margin: "1em" }}>
      <p>
        {code === "" ? (
          "Create new code"
        ) : (
          <>
            Add code under <b>{code}</b>
          </>
        )}
        <Button floated="right" compact size="mini" icon="delete" onClick={() => setOpen(false)} />
      </p>
      <Form onSubmit={() => addCode(textInput)}>
        <Popup
          open={alreadyExists}
          trigger={
            <Input
              autoFocus
              onChange={(e, d) => {
                setTextInput(d.value);
                setAlreadyExists(false);
              }}
              value={textInput}
              icon={<Icon name="plus" inverted circular link onClick={() => addCode(textInput)} />}
              placeholder="new code"
            />
          }
        >
          Code label already exists
        </Popup>
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
          <label>Parent:</label>
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
          <label>Code:</label>
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

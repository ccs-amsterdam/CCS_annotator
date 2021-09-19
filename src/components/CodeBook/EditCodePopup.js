import { setAnnotations } from "actions";
import db from "apis/dexie";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, ButtonGroup, Dropdown, Form, Icon, Input, Popup } from "semantic-ui-react";

const EditCodePopup = ({
  children,
  codingjob,
  code,
  codes,
  setCodes,
  setChangeColor,
  settings,
}) => {
  const [open, setOpen] = useState(false);
  const [popupContent, setPopupContent] = useState(null);

  const buttonContent = () => {
    return (
      <ButtonGroup basic>
        {changeColorPopup()}
        <Button icon="plus" compact size="mini" onClick={() => addCodePopup(false)} />
        <Button icon="minus" compact size="mini" onClick={rmCodePopup} />
        <Button icon="shuffle" compact size="mini" onClick={moveCodePopup} />
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
        codingjob={codingjob}
        code={root ? "" : code.code}
        codes={codes}
        setOpen={setOpen}
        setCodes={setCodes}
      />
    );
  };

  const rmCodePopup = () => {
    setPopupContent(
      <RmCodePopup
        codingjob={codingjob}
        code={code.code}
        codes={codes}
        setOpen={setOpen}
        setCodes={setCodes}
      />
    );
  };

  const moveCodePopup = () => {
    setPopupContent(
      <MoveCodePopup
        codingjob={codingjob}
        code={code.code}
        codes={codes}
        setOpen={setOpen}
        setCodes={setCodes}
      />
    );
  };

  if (settings && !settings.can_edit_codes) {
    return children;
  }

  return (
    <Popup
      flowing
      hoverable
      wide
      position="bottom center"
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
            Create new root
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

const AddCodePopup = ({ codingjob, code, codes, setOpen, setCodes }) => {
  const codeMap = useSelector((state) => state.codeMap);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [textInput, setTextInput] = useState("");

  const addCode = async (newCode) => {
    if (newCode === "") return null;
    if (codeMap[newCode]) {
      setAlreadyExists(true);
      return null;
    }
    const updatedCodes = [...codes];
    updatedCodes.push({ code: newCode, parent: code, active: true });
    await db.writeCodes(codingjob, updatedCodes);
    setCodes(updatedCodes);
    setOpen(false);
  };

  return (
    <div style={{ margin: "1em" }}>
      <p>
        Add code under <b>{code === "" ? "Root" : code}</b>
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

const RmCodePopup = ({ codingjob, code, codes, setOpen, setCodes }) => {
  const codeMap = useSelector((state) => state.codeMap);
  const annotations = useSelector((state) => state.annotations.span);
  const dispatch = useDispatch();

  const rmCode = async (keepChildren) => {
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

    await db.writeCodes(codingjob, updatedCodes);

    const removeCodes = [code, ...children];
    let annotationsHasChanged = false;
    for (let i of Object.keys(annotations)) {
      for (let rmCode of removeCodes) {
        if (annotations[i][rmCode]) {
          delete annotations[i][rmCode];
          annotationsHasChanged = true;
        }
      }
    }

    await db.modifyAnnotations(codingjob, removeCodes, null);
    if (annotationsHasChanged) dispatch(setAnnotations({ ...annotations }));

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

const MoveCodePopup = ({ codingjob, code, codes, setOpen, setCodes }) => {
  const codeMap = useSelector((state) => state.codeMap);
  const annotations = useSelector((state) => state.annotations);
  const dispatch = useDispatch();
  const [newParent, setNewParent] = useState(codeMap[code].parent);
  const [textInput, setTextInput] = useState(code);

  const parentOptions = ["ROOT", ...getAllParentOptions(codeMap, code)]; // fills parents array

  const mvCode = async (newCode, newParent) => {
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

    // update codingjob in db
    await db.writeCodes(codingjob, updatedCodes);
    // update all annotations
    await db.modifyAnnotations(codingjob, [code], newCode);

    // update tokens of current annotations (so changes are immediately visible without having to reload unit)
    let annotationsHasChanged = false;
    for (let textUnit of Object.keys(annotations)) {
      for (let i of Object.keys(annotations[textUnit])) {
        if (annotations[textUnit][i][code]) {
          annotations[textUnit][i][newCode] = { ...annotations[textUnit][i][code] };
          delete annotations[textUnit][i][code];
          annotationsHasChanged = true;
        }
      }
    }
    if (annotationsHasChanged) dispatch(setAnnotations({ ...annotations }));

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

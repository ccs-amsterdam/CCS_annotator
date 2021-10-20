import React, { useEffect, useState } from "react";
import { Button, Icon, Table, Popup, Modal, TextArea, Dropdown } from "semantic-ui-react";
import { codeBookEdgesToMap, getCodeTreeArray } from "util/codebook";
import EditCodePopup from "./EditCodePopup";
import { textToCodes, ctaToText } from "util/codebook";
import Help from "./Help";
import { blockEvents } from "actions";
import { useDispatch } from "react-redux";

// NOTE TO SELF: make toggle on/off and edit optional. Toggle on/off makes sense for
// imported annotations. Edit for making a codebook
// problem: how to deal with renaming existing codes. (maybe just freeze used codes from editing)

/**
 * Display an editable codebook
 */
const CodesEditor = ({ codes, setCodes, height = "100%" }) => {
  const [codeMap, setCodeMap] = useState({});
  const [codeTreeArray, setCodeTreeArray] = useState([]);
  const [changeColor, setChangeColor] = useState(null);

  const showColors = true;

  useEffect(() => {
    if (!codes || codes.length === 0) {
      setCodeTreeArray([]);
      return;
    }
    const cm = codeBookEdgesToMap(codes);
    setCodeMap(cm);
    setCodeTreeArray(getCodeTreeArray(cm, showColors));
  }, [codes, setCodeTreeArray, setCodeMap, showColors]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (changeColor) {
        changeCodeColor(changeColor.code, changeColor.color, codes, setCodes);
      }
      setChangeColor(null);
    }, 500);
    return () => clearTimeout(timer);
  }, [codes, setCodes, changeColor, setChangeColor]);

  const formatCode = (code) => {
    const color = code.active == null || code.active ? "black" : "grey";
    if (code.level === 0) return { fontWeight: "bold", fontSize: "15px", color };
    if (code.level === 1) return { fontSize: "12px", color };
    if (code.level === 2) return { fontSize: "12px", color };
    return { fontSize: "10px", color };
  };

  const onBranchSelect = (code, value) => {
    const newCodes = [...codes];
    newCodes.find((nc) => nc.code === code).branching = value;
    setCodes(newCodes);
  };

  const onAnswerOptions = [
    { key: "next", text: "next", value: "next", description: "Go to next question" },
    {
      key: "nextUnit",
      text: "next unit",
      value: "nextUnit",
      description: "Go to next unit",
    },
    { key: "skipOne", text: "skip one", value: "skipOne", description: "Skip next question" },
    { key: "skipTwo", text: "skip two", value: "skipTwo", description: "Skip two questions" },
    {
      key: "skipThree",
      text: "skip three",
      value: "skipThree",
      description: "Skip three question",
    },
  ];

  return (
    <div>
      <Table
        singleLine
        columns={1}
        unstackable
        textAlign="left"
        style={{ border: "0", boxShadow: "0", width: "100%" }}
      >
        <Table.Header className="codes-thead"></Table.Header>
        <Table.Body
          style={{ height: height, margin: "0", overflow: "visible" }}
          className="codes-tbody"
        >
          <Table.Row className="codes-tr">
            <Table.HeaderCell textAlign="center">
              <Icon name="settings" />
            </Table.HeaderCell>
            <Table.HeaderCell style={{ position: "relative", paddingLeft: "0.5em" }}>
              Codebook
            </Table.HeaderCell>
            <Table.HeaderCell style={{ textAlign: "right" }}>
              Branching
              <Help
                header="Simple branching"
                texts={[
                  `By default, answering a question moves the coder to the 'next' question, and to the next unit if it was the last question.`,
                  `Sometimes, you instead want a certain answer to immediately move to the 'next unit', or to 'skip' a follow up question`,
                ]}
              />
            </Table.HeaderCell>
          </Table.Row>
          {[...codeTreeArray].map((code, i) => {
            if (code.foldToParent) return null;

            return (
              <Table.Row
                className="codes-tr"
                key={i}
                style={
                  {
                    // backgroundColor: code.level === 0 ? "lightgrey" : null,
                  }
                }
              >
                <Table.Cell
                  className="codes-td"
                  width={1}
                  style={{
                    border: "1px solid black",
                    padding: "0",
                    margin: "0",
                    borderRight: code.active == null ? null : "1px solid black",
                  }}
                >
                  <EditCodePopup
                    codeMap={codeMap}
                    code={code}
                    codes={codes}
                    setCodes={setCodes}
                    toggleActiveCode={toggleActiveCode}
                    setChangeColor={setChangeColor}
                  />
                </Table.Cell>

                <Table.Cell
                  className="codes-td"
                  style={{
                    paddingLeft: "0.5em",
                    borderTop: code.level === 0 ? "1px solid black" : null,
                    //borderBottom: code.level === 0 ? "1px solid black" : null,
                  }}
                >
                  <span style={{ ...formatCode(code), marginLeft: `${2 * code.level}em` }}>
                    {code.code}
                    {code.totalChildren === 0 || code.active == null ? null : (
                      <>
                        <Icon
                          style={{
                            padding: "0",
                            margin: "0",
                            marginLeft: "1em",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            toggleFoldCode(
                              codes,
                              code.code,
                              code.folded != null && code.folded,
                              setCodes
                            )
                          }
                          name={code.folded ? "caret right" : "dropdown"}
                        />
                        {!code.folded ? null : (
                          <span
                            style={{ color: "grey" }}
                          >{`${code.totalActiveChildren}/${code.totalChildren}`}</span>
                        )}
                      </>
                    )}
                  </span>
                </Table.Cell>
                <Table.Cell
                  className="codes-td"
                  style={{
                    textAlign: "right",
                    paddingLeft: "0.5em",
                    borderTop: code.level === 0 ? "1px solid black" : null,
                    //borderBottom: code.level === 0 ? "1px solid black" : null,
                  }}
                >
                  <Dropdown
                    inline
                    pointing="right"
                    options={onAnswerOptions}
                    value={code.branching}
                    onChange={(e, d) => onBranchSelect(code.code, d.value)}
                  />
                </Table.Cell>
              </Table.Row>
            );
          })}
          <EditCodePopup
            codeMap={codeMap}
            code={""}
            codes={codes}
            setCodes={setCodes}
            setChangeColor={setChangeColor}
          >
            <Icon name="cog" style={{ marginLeft: "0.7em", cursor: "pointer" }} />
          </EditCodePopup>
          <PlainTextEditor codes={codes} codeTreeArray={codeTreeArray} setCodes={setCodes} />
        </Table.Body>
      </Table>
    </div>
  );
};

const PlainTextEditor = ({ codes, codeTreeArray, setCodes }) => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [alreadyExists, setAlreadyExists] = useState([]);

  useEffect(() => {
    dispatch(blockEvents(open));
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch, open]);

  useEffect(() => {
    setTextInput(ctaToText(codeTreeArray, 2, 40));
  }, [codeTreeArray]);

  const onSave = () => {
    const [updatedCodes, duplicates] = textToCodes(textInput, "", []);
    if (duplicates.length > 0) {
      setAlreadyExists(duplicates);
      return null;
    }
    setCodes(updatedCodes);
    setOpen(false);
  };

  return (
    <Modal
      on="click"
      open={open}
      style={{ width: "700px", maxWidth: "100%", overflowX: "auto" }}
      trigger={
        <Button fluid onClick={() => setOpen(true)} style={{ padding: "0.3em 1em" }}>
          Plain text editor
        </Button>
      }
    >
      <Popup
        open={alreadyExists.length > 0}
        trigger={
          <TextArea
            autoFocus
            rows={20}
            onChange={(e, d) => {
              setTextInput(d.value);
            }}
            value={textInput}
            style={{ fontFamily: "monospace", height: "100%", width: "100%" }}
            placeholder="Every line is a code\n\nindent codes to make a tree, like\nparent\n  child\n    grandchild\n\nAdd colors with:\ncode   #color(red)"
          />
        }
      >
        Duplicate labels: <br />
        <b>{alreadyExists.join(", ")}</b>
      </Popup>

      <Modal.Actions>
        <Button color="black" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button content="Save changes" onClick={onSave} positive />
      </Modal.Actions>
    </Modal>
  );
};

const changeCodeColor = (code, color, codes, setCodes) => {
  let updatedCodes = codes.map((ucode) => {
    if (ucode.code === code) ucode.color = color;
    return ucode;
  });
  setCodes(updatedCodes);
};

const toggleActiveCode = (codes, code, active, setCodes) => {
  let updatedCodes = [...codes];

  const selectedCode = updatedCodes.find((ucode) => ucode.code === code);

  // there is a possibility that code.code does not exist, if it only existed as a parent
  // this is ideally resolved upstream (when creating the codebook), but as a plan B it can be added here
  if (selectedCode) {
    selectedCode.active = active;
  } else updatedCodes.push({ code: code, parent: "", active: true });

  setCodes(updatedCodes);
};

const toggleFoldCode = (codes, code, folded, setCodes) => {
  let updatedCodes = [...codes];

  const selectedCode = updatedCodes.find((ucode) => ucode.code === code);

  // there is a possibility that code.code does not exist, if it only existed as a parent
  // this is ideally resolved upstream (when creating the codebook), but as a plan B it can be added here
  if (selectedCode) {
    selectedCode.folded = !folded;
  } else updatedCodes.push({ code: code, parent: "", active: true, folded: !folded });

  setCodes(updatedCodes);
};

export default CodesEditor;

import React, { useEffect, useState } from "react";
import { Button, Icon, Table, Popup, Modal, TextArea, Dropdown, Label } from "semantic-ui-react";
import { codeBookEdgesToMap, getCodeTreeArray } from "react-ccs-annotator";
import EditCodePopup from "./EditCodePopup";
import { textToCodes, ctaToText } from "library/codebookManagement";
import { blockEvents } from "actions";
import Help from "./Help";
import { useDispatch } from "react-redux";

// NOTE TO SELF: make toggle on/off and edit optional. Toggle on/off makes sense for
// imported annotations. Edit for making a codebook
// problem: how to deal with renaming existing codes. (maybe just freeze used codes from editing)

/**
 * Display an editable codebook
 * @param {Array} codes an array of strings, or an array of objects with at least the key 'code'
 * @param {Function} setCodes the callback for setting codes state
 * @param {Array} questions Optional, an array with questions. This enables the 'makes irrelevant' column
 */
const CodesEditor = ({ codes, setCodes, questions, question, canAdd = true, height = "100%" }) => {
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

  const onChangeBranching = (code, values) => {
    const newCodes = [...codes];
    const makes_irrelevant = [];
    const required_for = [];

    for (let v of values) {
      const [type, value] = v.split(/_(.+)/);
      if (type === "Skip") makes_irrelevant.push(value);
      if (type === "Required for") required_for.push(value);
    }

    const updateCode = newCodes.find((nc) => nc.code === code);
    updateCode.makes_irrelevant = makes_irrelevant;
    updateCode.required_for = required_for.filter((rf) => !makes_irrelevant.includes(rf));
    setCodes(newCodes);
  };

  return (
    <div>
      <Table
        columns={3}
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
              <div hidden={question == null} style={{ marginRight: "18px" }}>
                Branching
                <Help
                  header="Make other questions conditional on this answer"
                  texts={[
                    `Certain answers can make other questions irrelevant.
           For example, you might first ask if a text is relevant (for your study).
           If it isn't, you don't need your coder to waste time answering the remaining questions.
           In this case, you can set branching to "Skip all".`,
                    `You can also let an answer "Skip a specific questions", so that certain follow-up questions
           are only asked if certain conditions are met.`,
                    `Alternatively, you can specify that an answer is "Required for a specific question" (which is just shorthand for Skip for all other answers)`,
                    `It is recommended to implement branching as a final step, and to use the preview to test whether it works as intended`,
                  ]}
                />
              </div>
            </Table.HeaderCell>
          </Table.Row>
          {[...codeTreeArray].map((code, i) => {
            if (code.foldToParent) return null;

            return (
              <Table.Row className="codes-tr" key={i} style={{}}>
                <Table.Cell
                  className="codes-td"
                  width={1}
                  style={{
                    border: "1px solid black",
                    padding: "0",
                    margin: "0",
                    background: "#1B1C1D",

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
                    canAdd={canAdd}
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
                  <span style={{ ...formatCode(code), marginLeft: `${1 * code.level}em` }}>
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
                  {branchingDropdown(question, questions, code, onChangeBranching)}
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
            canAdd={canAdd}
          >
            <Icon name="cog" style={{ marginLeft: "0.7em", cursor: "pointer" }} />
          </EditCodePopup>
          <PlainTextEditor codes={codes} codeTreeArray={codeTreeArray} setCodes={setCodes} />
        </Table.Body>
      </Table>
    </div>
  );
};

// const makesIrrelevantHeader = (questions) => {
//   if (!questions) return null;

//   return (
//     <>
//       Makes irrelevant
//       <Help
//         header="Make other questions conditional on this answer"
//         texts={[
//           `Certain answers can make other questions irrelevant.
//            For example, you might first ask if a text is relevant (for your study).
//            If it isn't, you don't need your coder to waste time answering the remaining questions.
//            In this case, you can set "makes irrelevant" to "remaining". All remaning questions in the current
//            unit will then be annotated with the value IRRELEVANT`,
//           `You can also let an answer make specific other questions irrelevant.
//            This way you can implement simple branching patterns, where certain follow-up questions
//            are only asked if certain conditions are met.`,
//           `It is recommended to setup branching after the name and order of questions is finalized.
//            Branching does changes automatically when name/order changes, but always double check.`,
//         ]}
//       />
//     </>
//   );
// };

const branchingDropdown = (question, questions, code, onChangeBranching) => {
  if (!questions) return null;

  const options = makesIrrelevantOptions(question, questions, code);
  const makes_irrelevant_values = code.makes_irrelevant.map((mi) => "Skip_" + mi);
  const required_for_values = code.required_for.map((rf) => "Required for_" + rf);
  const values = [...makes_irrelevant_values, ...required_for_values];

  const validValues = values.filter((v) => options.some((o) => o.value === v));
  if (validValues.length < values.length) onChangeBranching(code.code, validValues);

  return (
    <Dropdown
      multiple
      header="Determine how this answer affects remaining questions"
      direction="left"
      options={options}
      value={validValues}
      renderLabel={renderMakesIrrelevantLabel}
      onChange={(e, d) => {
        let values = d.value;
        onChangeBranching(code.code, values);
      }}
      style={{ paddingRight: "0", textAlign: "right" }}
    />
  );
};

const makesIrrelevantOptions = (question, questions, code) => {
  const options = [];

  if (!code.required_for.includes("REMAINING"))
    options.push({
      key: "skipremaining",
      content: (
        <>
          <Label color="red">Skips</Label>
          All remaining questions
        </>
      ),
      value: "Skip_REMAINING",
      color: "red",
    });

  // if 'all' is selected, don't show the other options
  //if (code.makes_irrelevant.includes("remaining")) return options;
  const n = questions.length || 0;
  for (let i = 0; i < n; i++) {
    if (questions[i].name === question.name) continue;
    if (!code.required_for.includes(questions[i].name)) {
      options.push({
        key: "skip" + i,
        content: (
          <>
            <Label color="red">Skips</Label>
            {questions[i].name}
          </>
        ),
        color: "red",
        value: "Skip_" + questions[i].name,
      });
    }
  }

  if (!code.makes_irrelevant.includes("REMAINING"))
    options.push({
      key: "requiredremaining",
      content: (
        <>
          <Label color="green">Required for</Label>
          All remaining questions
        </>
      ),
      value: "Required for_REMAINING",
      color: "green",
    });

  for (let i = 0; i < n; i++) {
    if (questions[i].name === question.name) continue;
    if (!code.makes_irrelevant.includes(questions[i].name)) {
      options.push({
        key: "required" + i,
        content: (
          <>
            <Label color="green">Required for</Label>
            {questions[i].name}
          </>
        ),
        color: "green",
        value: "Required for_" + questions[i].name,
      });
    }
  }

  return options;
};

const renderMakesIrrelevantLabel = (label) => ({
  content: label.value.replace("Skip_", "").replace("Required for_", ""),
  style: {
    fontSize: "12px",
    padding: "0",
    color: label.color,
    background: "white",
    border: "0",
    boxShadow: "none",
  },
});

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
    const [updatedCodes, duplicates] = textToCodes(
      textInput,
      "",
      [],
      codes.filter((c) => c.frozen)
    );
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
      style={{ width: "700px", maxWidth: "100%", overflowX: "auto", padding: "0.3em" }}
      trigger={
        <Button
          fluid
          onClick={() => setOpen(true)}
          style={{ padding: "0.3em 1em", borderRadius: "0" }}
        >
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

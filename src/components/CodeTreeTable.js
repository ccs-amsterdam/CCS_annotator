import React, { useEffect, useState } from "react";
import {
  Button,
  ButtonGroup,
  Dropdown,
  Form,
  Icon,
  Input,
  Popup,
  Search,
  Table,
  Checkbox,
} from "semantic-ui-react";
import { randomColor } from "randomcolor";
import { useDispatch, useSelector } from "react-redux";
import { setAnnotations, setCodeMap } from "../actions";
import db from "../apis/dexie";

const resultRenderer = ({ code, codeTrail }) => (
  <div key="content" className="content">
    <div className="title">{code}</div>
    <div className="description">{codeTrail.join(" -> ")}</div>
  </div>
);

const CodeTreeTable = ({ showColors = true, typeDelay = 0, height = "30vh" }) => {
  const codingjob = useSelector(state => state.codingjob);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [value, setValue] = useState("");

  const [codeTreeArray, setCodeTreeArray] = useState([]);
  const [settings, setSettings] = useState(null);
  const [activeRow, setActiveRow] = useState(-1);
  const [codes, setCodes] = useState([]);
  const [changeColor, setChangeColor] = useState(null);
  const ref = React.useRef();

  useEffect(() => {
    if (!codingjob) return null;
    loadCodes(codingjob, setCodes, setSettings);
  }, [codingjob, dispatch]);

  useEffect(() => {
    if (!codes || codes.length === 0) {
      setCodeTreeArray([]);
      dispatch(setCodeMap({}));
      return;
    }
    const codeMap = prepareCodeMap(codes);
    const cta = getCodeTreeArray(codeMap, showColors);
    setCodeTreeArray(cta);
    dispatch(setCodeMap(codeMap));
  }, [codes, showColors, dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (changeColor) {
        changeCodeColor(codingjob, changeColor.code, changeColor.color, codes, setCodes);
      }
      setChangeColor(null);
    }, 500);
    return () => clearTimeout(timer);
  }, [codingjob, codes, setCodes, changeColor, setChangeColor]);

  const timeoutRef = React.useRef();
  const handleSearchChange = React.useCallback(
    (e, data, codeTreeArray) => {
      clearTimeout(timeoutRef.current);
      setLoading(true);
      setValue(data.value);
      setActiveRow(-1);

      timeoutRef.current = setTimeout(() => {
        if (data.value.length === 0) {
          setLoading(false);
          setResults(false);
          return;
        }

        const re = new RegExp(data.value.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
        const isMatch = code => re.test(code.code);

        setLoading(false);
        setResults(codeTreeArray.filter(isMatch));
      }, typeDelay);
    },
    [typeDelay]
  );

  useEffect(() => {
    if (ref.current && activeRow >= 0)
      ref.current.scrollIntoView(false, {
        block: "center",
      });
  }, [ref, activeRow]);

  React.useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const formatCode = code => {
    const color = code.active == null || code.active ? "black" : "grey";
    if (code.level === 0) return { fontWeight: "bold", fontSize: "15px", color };
    if (code.level === 1) return { fontSize: "12px", color };
    if (code.level === 2) return { fontSize: "10px", color };
    return { fontSize: "10px", color };
  };

  return (
    <Table singleLine columns={2} textAlign="left">
      <Table.Header className="codes-thead">
        <Table.Row>
          <Table.HeaderCell>
            <Search
              fluid
              showNoResults={false}
              loading={loading}
              onResultSelect={(e, d) => {
                setValue(d.result.code);
                setActiveRow(d.result.i);
              }}
              onSearchChange={(e, d) => {
                if (d.results.length > 0) {
                  setActiveRow(d.results[[0]].i);
                } else {
                  setActiveRow(-1);
                }
                handleSearchChange(e, d, codeTreeArray);
              }}
              resultRenderer={resultRenderer}
              results={results}
              value={value}
              selectFirstResult={true}
            />
          </Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body style={{ height: height, margin: "0" }} className="codes-tbody">
        <Table.Row className="codes-tr">
          <Table.HeaderCell textAlign="center">
            <Icon name="shutdown" />
          </Table.HeaderCell>
          <Table.HeaderCell>Codebook</Table.HeaderCell>
        </Table.Row>
        {[...codeTreeArray].map((code, i) => {
          if (code.foldToParent) return null;

          return (
            <Table.Row
              className="codes-tr"
              active={i === activeRow}
              key={i}
              style={{
                backgroundColor: code.level === 0 ? "lightgrey" : null,
              }}
            >
              <Table.Cell
                className="codes-td"
                width={1}
                style={{
                  border: "1px solid black",
                  borderRight: code.active == null ? null : "1px solid black",
                  backgroundColor: code.color && code.active ? code.color : "white",
                }}
              >
                {code.active == null ? null : (
                  <Checkbox
                    slider
                    checked={code.active && code.activeParent}
                    style={{ transform: "scale(0.6)", width: "1.5em" }}
                    onChange={(e, d) => {
                      toggleActiveCode(codingjob, codes, code.code, d.checked, setCodes);
                    }}
                  />
                )}
              </Table.Cell>

              <Table.Cell
                className="codes-td"
                style={{
                  borderTop: code.level === 0 ? "1px solid black" : null,
                  borderBottom: code.level === 0 ? "1px solid black" : null,
                }}
              >
                <span
                  ref={i === activeRow ? ref : null}
                  style={{ ...formatCode(code), marginLeft: `${2 * code.level}em` }}
                >
                  <EditCodePopup
                    codingjob={codingjob}
                    code={code}
                    codes={codes}
                    setCodes={setCodes}
                    setChangeColor={setChangeColor}
                    settings={settings}
                  >
                    <Icon name="cog" style={{ marginRight: "0.5em", cursor: "pointer" }} />
                  </EditCodePopup>
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
                            codingjob,
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
            </Table.Row>
          );
        })}
        <EditCodePopup
          codingjob={codingjob}
          code={""}
          codes={codes}
          setCodes={setCodes}
          setChangeColor={setChangeColor}
          settings={settings}
        >
          <Icon name="cog" style={{ marginLeft: "0.7em", cursor: "pointer" }} />
        </EditCodePopup>
      </Table.Body>
    </Table>
  );
};

const changeCodeColor = async (codingjob, code, color, codes, setCodes) => {
  let updatedCodes = codes.map(ucode => {
    if (ucode.code === code) ucode.color = color;
    return ucode;
  });
  await db.writeCodes(codingjob, updatedCodes);
  setCodes(updatedCodes);
};

const loadCodes = async (codingjob, setCodes, setSettings) => {
  const cj = await db.getCodingjob(codingjob);

  if (cj.codebook) {
    const cb = cj.codebook;
    if (cb && cb.codes && cb.codes.length > 0) {
      setCodes(cb.codes);
    } else {
      setCodes([]);
    }
    if (cb && cb.settings) {
      setSettings(cb.settings);
    }
  } else {
    setCodes([]);
    setSettings(null);
  }
};

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
        {code.code && code.active != null ? (
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
            onChange={e => setChangeColor({ code: code.code, color: e.target.value })}
            type="color"
            value={code.color}
          />
        ) : null}
        <Button icon="plus" compact size="mini" onClick={() => addCodePopup(false)} />
        <Button icon="minus" compact size="mini" onClick={rmCodePopup} />
        <Button icon="shuffle" compact size="mini" onClick={moveCodePopup} />
      </ButtonGroup>
    );
  };

  const addCodePopup = root => {
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
  const codeMap = useSelector(state => state.codeMap);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [textInput, setTextInput] = useState("");

  const addCode = async newCode => {
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
  const codeMap = useSelector(state => state.codeMap);
  const annotations = useSelector(state => state.spanAnnotations);
  const dispatch = useDispatch();

  const rmCode = async keepChildren => {
    let updatedCodes = codes.filter(ucode => ucode.code !== code);

    const children = [];
    if (!keepChildren) {
      getAllChildren(codeMap, code, children);
      updatedCodes = updatedCodes.filter(ucode => !children.includes(ucode.code));
    } else {
      updatedCodes = updatedCodes.map(ucode => {
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
  const codeMap = useSelector(state => state.codeMap);
  const annotations = useSelector(state => state.spanAnnotations);
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
    let updatedCodes = codes.map(ucode => {
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
    codes = codes.filter(code => code.parent !== "ROOT");

    // update codingjob in db
    await db.writeCodes(codingjob, updatedCodes);
    // update all annotations
    await db.modifyAnnotations(codingjob, [code], newCode);

    // update tokens of current annotations (so changes are immediately visible without having to reload unit)
    let annotationsHasChanged = false;
    for (let i of Object.keys(annotations)) {
      if (annotations[i][code]) {
        annotations[i][newCode] = { ...annotations[i][code] };
        delete annotations[i][code];
        annotationsHasChanged = true;
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

const toggleActiveCode = async (codingjob, codes, code, active, setCodes) => {
  let updatedCodes = [...codes];

  const selectedCode = updatedCodes.find(ucode => ucode.code === code);

  // there is a possibility that code.code does not exist, if it only existed as a parent
  // this is ideally resolved upstream (when creating the codebook), but as a plan B it can be added here
  if (selectedCode) {
    selectedCode.active = active;
  } else updatedCodes.push({ code: code, parent: "", active: true });

  await db.writeCodes(codingjob, updatedCodes);
  setCodes(updatedCodes);
};

const toggleFoldCode = async (codingjob, codes, code, folded, setCodes) => {
  let updatedCodes = [...codes];

  const selectedCode = updatedCodes.find(ucode => ucode.code === code);

  // there is a possibility that code.code does not exist, if it only existed as a parent
  // this is ideally resolved upstream (when creating the codebook), but as a plan B it can be added here
  if (selectedCode) {
    selectedCode.folded = !folded;
  } else updatedCodes.push({ code: code, parent: "", active: true, folded: !folded });

  await db.writeCodes(codingjob, updatedCodes);
  setCodes(updatedCodes);
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
  return Object.keys(codeMap).filter(parent => !children.includes(parent) && parent !== code);
};

const getCodeTreeArray = (codeMap, showColors) => {
  let parents = Object.keys(codeMap).filter(
    code => !codeMap[code].parent || codeMap[code].parent === ""
  );
  const codeTreeArray = [];
  fillCodeTreeArray(codeMap, parents, codeTreeArray, [], showColors);
  return codeTreeArray.map((object, i) => ({ ...object, i: i }));
};

const fillCodeTreeArray = (codeMap, parents, codeTreeArray, codeTrail, showColors) => {
  for (const code of parents) {
    let newcodeTrail = [...codeTrail];
    newcodeTrail.push(code);

    codeTreeArray.push({
      ...codeMap[code],
      code: code,
      codeTrail: codeTrail,
      level: codeTrail.length,
      color: codeMap[code].color
        ? codeMap[code].color
        : randomColor({ seed: code, luminosity: "light" }),
    });

    if (codeMap[code].children) {
      fillCodeTreeArray(codeMap, codeMap[code].children, codeTreeArray, newcodeTrail, showColors);
    }
  }
};

const prepareCodeMap = codes => {
  // the payload is an array of objects, but for efficients operations
  // in the annotator we convert it to an object with the codes as keys
  const codeMap = codes.reduce((result, code) => {
    result[code.code] = { ...code, children: [], totalChildren: 0, totalActiveChildren: 0 };
    return result;
  }, {});

  // If there are codes of which the parent doesn't exist, add the parent
  const originalKeys = Object.keys(codeMap);
  for (const key of originalKeys) {
    if (codeMap[key].parent !== "" && !codeMap[codeMap[key].parent]) {
      codeMap[codeMap[key].parent] = {
        code: codeMap[key].parent,
        parent: "",
        children: [],
        active: false,
        totalChildren: 0,
        totalActiveChildren: 0,
      };
    }
  }

  // SOLVE THIS DIFFERENTLY!!
  // IF CODES ARE UPLOADED, ALWAYS ADD CODES THAT ONLY EXIST AS PARENTS AS CODES
  // JUST SET ACTIVE TO FALSE
  // THIS WAY, WE DON'T NEED A SEPARATE LOGIC, AND THEY BY DEFAULT CAN'T BE CODED ANYWAY

  for (const code of Object.keys(codeMap)) {
    if (!codeMap[code].color)
      codeMap[code].color = randomColor({ seed: code, luminosity: "light" });

    [codeMap[code].tree, codeMap[code].activeParent, codeMap[code].foldToParent] = parentData(
      codeMap,
      code
    );

    if (codeMap[code].parent) codeMap[codeMap[code].parent].children.push(code);

    for (const parent of codeMap[code].tree) {
      codeMap[parent].totalChildren++;
      if (codeMap[code].active && codeMap[code].activeParent) {
        codeMap[parent].totalActiveChildren++;
      }
    }
  }

  return codeMap;
};

// const getParentTree = (codes, code) => {
//   const parents = [];
//   let parent = codes[code].parent;
//   while (parent) {
//     parents.push(parent);
//     parent = codes[parent].parent;
//   }
//   return parents.reverse();
// };

const parentData = (codes, code) => {
  // get array of parents from highest to lowers (tree)
  // look at parents to see if one is not active (activeParent).
  //    (this only matters if the same parent is folded, otherwise only the parent code itself is inactive)
  // look if there are folded parents, and if so pick the highest (foldToParent)
  const parents = [];
  let activeParent = true;
  let foldToParent = "";

  let parent = codes[code].parent;
  while (parent) {
    parents.push(parent);
    if (codes[parent].folded != null && codes[parent].folded) {
      foldToParent = parent; // this ends up being the highest level folded parent

      // code is inactive if only one of the folded parents is inactive
      if (codes[parent].active != null && !codes[parent].active) activeParent = false;
    }
    parent = codes[parent].parent;
  }
  return [parents.reverse(), activeParent, foldToParent];
};

export default CodeTreeTable;

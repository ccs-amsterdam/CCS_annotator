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
} from "semantic-ui-react";
import { randomColor } from "randomcolor";
import { useDispatch, useSelector } from "react-redux";
import { blockEvents, setCodeMap } from "../actions";
import db from "../apis/dexie";

const resultRenderer = ({ code, codeTrail }) => (
  <div key="content" className="content">
    <div className="title">{code}</div>
    <div className="description">{codeTrail.join(" -> ")}</div>
  </div>
);

const CodeTreeTable = ({ showColors = false, typeDelay = 0, height = "30vh" }) => {
  const codingjob = useSelector(state => state.codingjob);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [value, setValue] = useState("");

  const [codeTreeArray, setCodeTreeArray] = useState([]);
  const [settings, setSettings] = useState(null);
  const [activeRow, setActiveRow] = useState(-1);
  const [codes, setCodes] = useState([]);
  const ref = React.useRef();

  useEffect(() => {
    if (!codingjob) return null;
    if (codingjob.codebook) {
      const cb = JSON.parse(codingjob.codebook);
      if (cb && cb.codes && cb.codes.length > 0) {
        setCodes(cb.codes);
      } else {
        setCodes([]);
      }
      if (cb && cb.settings) {
        setSettings(cb.settings);
      }
    }
  }, [codingjob, dispatch]);

  useEffect(() => {
    if (!codes || codes.length === 0) return;
    const codeMap = prepareCodeMap(codes);
    const cta = getCodeTreeArray(codeMap, showColors);
    setCodeTreeArray(cta);
    dispatch(setCodeMap(codeMap));
  }, [codes, showColors, dispatch]);

  const timeoutRef = React.useRef();
  const handleSearchChange = React.useCallback(
    (e, data, codeTreeArray) => {
      clearTimeout(timeoutRef.current);
      setLoading(true);
      setValue(data.value);

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
    if (ref.current)
      ref.current.scrollIntoView(false, {
        block: "center",
      });
  }, [ref, activeRow]);

  React.useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const formatCode = level => {
    if (level === 0) return { fontWeight: "bold", fontSize: "15px", cursor: "pointer" };
    if (level === 1) return { fontSize: "15px", cursor: "pointer" };
    if (level === 2) return { fontSize: "14px", cursor: "pointer" };
    return { fontSize: "13px", cursor: "pointer" };
  };

  return (
    <>
      <Table singleLine>
        <Table.Header className="codes-thead">
          <Table.Row>
            <Table.HeaderCell>
              <Search
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
              ></Search>
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body style={{ height: height }} className="codes-tbody">
          {[...codeTreeArray, ""].map((code, i) => {
            return (
              <Table.Row className="codes-tr" active={i === activeRow} key={i}>
                <Table.Cell className="codes-td">
                  <EditCodePopup
                    codingjob={codingjob}
                    code={code}
                    codes={codes}
                    setCodes={setCodes}
                    settings={settings}
                  >
                    <span ref={i === activeRow ? ref : null} style={formatCode(code.level)}>
                      {code.codeTrailSpan}
                      {code.code}
                    </span>
                  </EditCodePopup>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </>
  );
};

const EditCodePopup = ({ children, codingjob, code, codes, setCodes, settings }) => {
  const codeMap = useSelector(state => state.codeMap);
  const [open, setOpen] = useState(false);
  const [popupContent, setPopupContent] = useState(null);

  const buttonContent = () => {
    return (
      <>
        Edit
        <ButtonGroup size="tiny">
          <Button
            icon="plus"
            compact
            size="mini"
            style={{
              paddingLeft: "5px",
              paddingRight: "0px",
              backgroundColor: "white",
            }}
            onClick={addCodePopup}
          />
          <Button
            icon="minus"
            compact
            size="mini"
            style={{ paddingLeft: "0px", paddingRight: "0px", backgroundColor: "white" }}
            onClick={rmCodePopup}
          />
          <Button
            icon="shuffle"
            compact
            size="mini"
            style={{ paddingLeft: "0px", paddingRight: "0px", backgroundColor: "white" }}
            onClick={moveCodePopup}
          />
        </ButtonGroup>
      </>
    );
  };

  const addCodePopup = () => {
    setPopupContent(
      <AddCodePopup
        codingjob={codingjob}
        code={code.code}
        codes={codes}
        codeMap={codeMap}
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
        codeMap={codeMap}
        setOpen={setOpen}
        setCodes={setCodes}
      />
    );
  };

  const moveCodePopup = () => {
    console.log(code.code);
    console.log(code);
    setPopupContent(
      <MoveCodePopup
        codingjob={codingjob}
        code={code.code}
        codes={codes}
        codeMap={codeMap}
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
      position="left center"
      onClose={() => {
        setPopupContent(buttonContent());
        setOpen(false);
      }}
      open={open}
      mouseLeaveDelay={10000000} // just don't use mouse leave
      trigger={
        <span
          onClick={() => {
            setPopupContent(buttonContent);
            setOpen(true);
          }}
        >
          {children}
        </span>
      }
    >
      {popupContent}{" "}
    </Popup>
  );
};

const AddCodePopup = ({ codingjob, code, codes, codeMap, setOpen, setCodes }) => {
  const dispatch = useDispatch();
  const [textInput, setTextInput] = useState("");

  useEffect(() => {
    dispatch(blockEvents(true));
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch]);

  const addCode = newCode => {
    if (newCode === "") return null;
    if (codeMap[newCode]) return null;
    const updatedCodes = [...codes];
    updatedCodes.push({ code: newCode, parent: code });
    db.writeCodes(codingjob, updatedCodes);
    setCodes(updatedCodes);
    setOpen(false);
  };

  return (
    <div>
      <p>
        Add code under <b>{code}</b>
        <Button floated="right" compact size="mini" icon="delete" onClick={() => setOpen(false)} />
      </p>
      <Form onSubmit={() => addCode(textInput)}>
        <Input
          autoFocus
          onChange={(e, d) => {
            setTextInput(d.value);
          }}
          value={textInput}
          icon={<Icon name="plus" inverted circular link onClick={() => addCode(textInput)} />}
          placeholder="new code"
        />
      </Form>
    </div>
  );
};

const RmCodePopup = ({ codingjob, code, codes, codeMap, setOpen, setCodes }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(blockEvents(true));
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch]);

  const rmCode = keepChildren => {
    let updatedCodes = codes.filter(ucode => ucode.code !== code);

    if (!keepChildren) {
      const children = [];
      getAllChildren(codeMap, code, children);
      updatedCodes = updatedCodes.filter(ucode => !children.includes(ucode.code));
    } else {
      updatedCodes = updatedCodes.map(ucode => {
        if (codeMap[code].children.includes(ucode.code)) ucode.parent = codeMap[code].parent;
        return ucode;
      });
    }

    db.writeCodes(codingjob, updatedCodes);
    setCodes(updatedCodes);
    setOpen(false);
  };

  return (
    <div>
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

const MoveCodePopup = ({ codingjob, code, codes, codeMap, setOpen, setCodes }) => {
  const dispatch = useDispatch();
  const [newParent, setNewParent] = useState(codeMap[code].parent);
  const [textInput, setTextInput] = useState(code);

  const parentOptions = getAllParentOptions(codeMap, code); // fills parents array

  useEffect(() => {
    dispatch(blockEvents(true));
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch]);

  const mvCode = (newCode, newParent) => {
    if (newCode !== code) {
      if (newCode === "") return null;
      if (codeMap[newCode]) return null;
    }
    let updatedCodes = codes.map(ucode => {
      if (ucode.code === code) {
        ucode.code = newCode;
        ucode.parent = newParent;
      }
      if (ucode.parent === code) {
        ucode.parent = newCode;
      }
      return ucode;
    });

    db.writeCodes(codingjob, updatedCodes);
    setCodes(updatedCodes);
    setOpen(false);
  };

  return (
    <div>
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
              console.log(d.value);
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
      code: code,
      codeTrail: codeTrail,
      level: codeTrail.length,
      codeTrailSpan: codeTrailSpan(code, codeTrail, showColors),
    });

    if (codeMap[code].children) {
      fillCodeTreeArray(codeMap, codeMap[code].children, codeTreeArray, newcodeTrail, showColors);
    }
  }
};

const codeTrailSpan = (code, codeTrail, showColors) => {
  return (
    <span
      style={{
        display: "inline-block",
        marginLeft: `${1 * codeTrail.length}em`,
        marginRight: "0.5em",
        height: "0.7em",
        width: "0.7em",
        borderRadius: "50%",
        background: showColors ? randomColor({ seed: code, luminosity: "light" }) : "grey",
        border: "1px solid black",
      }}
    ></span>
  );
};

const prepareCodeMap = codes => {
  // the payload is an array of objects, but for efficients operations
  // in the annotator we convert it to an object with the codes as keys
  const codeMap = codes.reduce((result, code) => {
    result[code.code] = { ...code, children: [] };
    return result;
  }, {});

  // If there are codes of which the parent doesn't exist, add the parent
  const originalKeys = Object.keys(codeMap);
  for (const key of originalKeys) {
    if (codeMap[key].parent !== "" && !codeMap[codeMap[key].parent])
      codeMap[codeMap[key].parent] = { code: codeMap[key].parent, parent: "", children: [] };
  }

  for (const code of Object.keys(codeMap)) {
    if (!codeMap[code].color)
      codeMap[code].color = randomColor({ seed: code, luminosity: "light" });
    codeMap[code].tree = getParentTree(codeMap, code);

    if (codeMap[codeMap[code].parent]) codeMap[codeMap[code].parent].children.push(code);
  }

  return codeMap;
};

const getParentTree = (codes, code) => {
  const parents = [];
  let parent = codes[code].parent;
  while (parent) {
    parents.push(parent);
    parent = codes[parent].parent;
  }
  return parents.reverse();
};

export default CodeTreeTable;

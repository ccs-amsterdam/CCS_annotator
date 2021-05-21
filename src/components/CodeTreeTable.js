import React, { useEffect, useState } from "react";
import {
  Button,
  ButtonGroup,
  Dropdown,
  Form,
  Header,
  Icon,
  Input,
  Popup,
  Search,
  Table,
} from "semantic-ui-react";
import { randomColor } from "randomcolor";
import { useDispatch, useSelector } from "react-redux";
import { blockEvents, setCodeMap } from "../actions";

const resultRenderer = ({ code, codeTrail }) => (
  <div key="content" className="content">
    <div className="title">{code}</div>
    <div className="description">{codeTrail.join(" -> ")}</div>
  </div>
);

const CodeTreeTable = ({ showColors = false, typeDelay = 0, height = "30vh" }) => {
  const codingjob = useSelector((state) => state.codingjob);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [value, setValue] = useState("");

  const [codeTree, setCodeTree] = useState({});
  const [codeTreeArray, setCodeTreeArray] = useState([]);
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
    }
  }, [codingjob, dispatch]);

  useEffect(() => {
    if (codes && codes.length > 0) dispatch(setCodeMap(prepareCodes(codes)));
  }, [codes, dispatch]);

  useEffect(() => {
    if (!codes) return;
    const codeTree = codelistToTree(codes);
    setCodeTree(codeTree);
    if (!codeTree) return;
    const cta = getCodeTreeArray(codeTree, showColors);
    setCodeTreeArray(cta);
  }, [codes, showColors, setCodeTree, setCodeTreeArray]);

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
        const isMatch = (code) => re.test(code.code);

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

  const formatCode = (level) => {
    if (level === 0) return { fontWeight: "bold", fontSize: "15px" };
    if (level === 1) return { fontSize: "15px" };
    if (level === 2) return { fontSize: "12px" };
    return { fontSize: "10px" };
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
                  setActiveRow(-1);
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
          {codeTreeArray.map((code, i) => {
            return (
              <Table.Row className="codes-tr" active={i === activeRow} key={i}>
                <Table.Cell className="codes-td">
                  {code.codeTrailSpan}
                  <span style={formatCode(code.level)} ref={i === activeRow ? ref : null}>
                    {code.code}
                    <EditCodePopup code={code.code} codeTree={codeTree} />
                  </span>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </>
  );
};

const EditCodePopup = ({ code, codeTree }) => {
  const codeMap = useSelector((state) => state.codeMap);
  const [open, setOpen] = useState(false);
  const [popupContent, setPopupContent] = useState(null);

  const addCodePopup = () => {
    setOpen(true);
    setPopupContent(<AddCodePopup code={code} codeMap={codeMap} setOpen={setOpen} />);
  };

  const rmCodePopup = () => {
    setOpen(true);
    setPopupContent(<RmCodePopup code={code} codeTree={codeTree} setOpen={setOpen} />);
  };

  const moveCodePopup = () => {
    setOpen(true);
    setPopupContent(
      <MoveCodePopup code={code} codeMap={codeMap} codeTree={codeTree} setOpen={setOpen} />
    );
  };

  return (
    <Popup
      flowing
      hoverable
      wide
      onClose={() => setOpen(false)}
      open={open}
      mouseLeaveDelay={10000000} // just don't use mouse leave
      position="top center"
      trigger={
        <ButtonGroup size="small" style={{ opacity: "0.4" }}>
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
      }
    >
      {popupContent}
    </Popup>
  );
};

const AddCodePopup = ({ code, codeMap, setOpen }) => {
  const dispatch = useDispatch();
  const [textInput, setTextInput] = useState("");

  useEffect(() => {
    dispatch(blockEvents(true));
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch]);

  const addCode = (newCode) => {
    if (newCode === "") return null;
    if (codeMap[newCode]) return null;

    console.log(newCode);
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
            console.log(d.value);
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

const RmCodePopup = ({ code, codeTree, setOpen }) => {
  const dispatch = useDispatch();
  const children = codeTree[code] ? Object.keys(codeTree[code]) : [];

  useEffect(() => {
    dispatch(blockEvents(true));
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch]);

  return (
    <div>
      <p>
        Delete <b>{code}</b>?
      </p>
      <ButtonGroup fluid>
        {children.length > 0 ? (
          <>
            <Button color="red">Yes</Button>
            <Button color="red">Yes, but keep children</Button>
          </>
        ) : (
          <Button color="red">Yes</Button>
        )}
        <Button onClick={() => setOpen(false)}>Cancel</Button>
      </ButtonGroup>
    </div>
  );
};

const MoveCodePopup = ({ code, codeMap, codeTree, setOpen }) => {
  const dispatch = useDispatch();
  const [newParent, setNewParent] = useState(codeMap[code].parent);
  const [textInput, setTextInput] = useState(code);

  console.log(code);
  console.log(codeMap);

  const parents = [];
  getAllParents(code, codeTree, parents); // fills parents array

  useEffect(() => {
    dispatch(blockEvents(true));
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch]);

  const addCode = (newCode) => {
    console.log("test");
    if (newCode === "") return null;
    if (codeMap[newCode]) return null;
    console.log(newCode);
  };

  return (
    <div>
      <p>
        Change parent and/or label
        <Button floated="right" compact size="mini" icon="delete" onClick={() => setOpen(false)} />
      </p>

      <Form onSubmit={() => addCode(textInput)}>
        <Form.Field inline>
          <label>Parent:</label>
          <Dropdown
            value={newParent}
            style={{ minWidth: "10em" }}
            options={parents.map((parent, i) => {
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
        <Button fluid onClick={() => addCode(textInput)}>
          Change
        </Button>
      </Form>
    </div>
  );
};

const getAllParents = (child, codeTree, parentsArray) => {
  for (const code of Object.keys(codeTree)) {
    if (code === child) return;
    parentsArray.push(code);
    if (codeTree[code].children) {
      getAllParents(child, codeTree[code].children, parentsArray);
    }
  }
};

const getCodeTreeArray = (codeTree, showColors) => {
  const codeTreeArray = [];
  fillCodeTreeArray(codeTree, codeTreeArray, [], showColors);
  return codeTreeArray.map((object, i) => ({ ...object, i: i }));
};

const fillCodeTreeArray = (codeTree, codeTreeArray, codeTrail, showColors) => {
  for (const code of Object.keys(codeTree)) {
    let newcodeTrail = [...codeTrail];
    newcodeTrail.push(code);

    codeTreeArray.push({
      code: code,
      codeTrail: codeTrail,
      level: codeTrail.length,
      codeTrailSpan: codeTrailSpan(code, codeTrail, showColors),
    });

    if (codeTree[code].children) {
      fillCodeTreeArray(codeTree[code].children, codeTreeArray, newcodeTrail, showColors);
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
        height: "1em",
        width: showColors ? "1em" : "0em",
        background: showColors ? randomColor({ seed: code, luminosity: "light" }) : "white",
        border: showColors ? "1px solid black" : "none",
      }}
    ></span>
  );
};

const codelistToTree = (codes) => {
  let parents = codes.reduce((roots, code) => {
    if (!code.parent || code.parent === "") roots[code.code] = { children: {} };
    return roots;
  }, {});

  let parentsDict = codes.reduce((dict, code) => {
    dict[code.code] = code.parent;
    return dict;
  }, {});

  return fillTree(parents, parentsDict);
};

const fillTree = (parents, parentsDict) => {
  const keys = Object.keys(parents);
  if (keys.length === 0) return {};

  for (const code of Object.keys(parentsDict)) {
    if (parents[parentsDict[code]]) {
      parents[parentsDict[code]].children[code] = {};
      delete parentsDict[code];
    }
  }

  for (const key of keys) parents[key] = fillTree(parents[key], parentsDict);
  return parents;
};

const prepareCodes = (codes) => {
  // the payload is an array of objects, but for efficients operations
  // in the annotator we convert it to an object with the codes as keys
  const codeMap = codes.reduce((result, code) => {
    result[code.code] = code;
    return result;
  }, {});

  for (const code of Object.keys(codeMap)) {
    if (!codeMap[code].color)
      codeMap[code].color = randomColor({ seed: code, luminosity: "light" });
    codeMap[code].tree = getParentTree(codeMap, code);
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

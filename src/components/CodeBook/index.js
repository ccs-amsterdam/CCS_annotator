import { setCodeMap } from "actions";
import db from "apis/dexie";
import { randomColor } from "randomcolor";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Checkbox, Icon, Search, Table } from "semantic-ui-react";
import { codeBookEdgesToMap } from "util/codebook";
import EditCodePopup from "./EditCodePopup";

const resultRenderer = ({ code, codeTrail }) => (
  <div key="content" className="content">
    <div className="title">{code}</div>
    <div className="description">{codeTrail.join(" -> ")}</div>
  </div>
);

const CodeBook = ({ showColors = true, typeDelay = 0, height = "30vh" }) => {
  const codingjob = useSelector((state) => state.codingjob);
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
    const codeMap = codeBookEdgesToMap(codes);
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
        const isMatch = (code) => re.test(code.code);

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

  const formatCode = (code) => {
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
  let updatedCodes = codes.map((ucode) => {
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

const toggleActiveCode = async (codingjob, codes, code, active, setCodes) => {
  let updatedCodes = [...codes];

  const selectedCode = updatedCodes.find((ucode) => ucode.code === code);

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

  const selectedCode = updatedCodes.find((ucode) => ucode.code === code);

  // there is a possibility that code.code does not exist, if it only existed as a parent
  // this is ideally resolved upstream (when creating the codebook), but as a plan B it can be added here
  if (selectedCode) {
    selectedCode.folded = !folded;
  } else updatedCodes.push({ code: code, parent: "", active: true, folded: !folded });

  await db.writeCodes(codingjob, updatedCodes);
  setCodes(updatedCodes);
};

const getCodeTreeArray = (codeMap, showColors) => {
  let parents = Object.keys(codeMap).filter(
    (code) => !codeMap[code].parent || codeMap[code].parent === ""
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

export default CodeBook;

import db from "apis/dexie";
import { randomColor } from "randomcolor";
import React, { useEffect, useState } from "react";
import { Checkbox, Icon, Table } from "semantic-ui-react";
import { codeBookEdgesToMap } from "util/codebook";
import EditCodePopup from "./EditCodePopup";

/**
 * Display an editable codebook that interacts with codingjob.codebook.codes
 */
const CodeBook = ({ codingjob, height = "80vh" }) => {
  const [codeMap, setCodeMap] = useState({});
  const [codeTreeArray, setCodeTreeArray] = useState([]);
  const [settings, setSettings] = useState(null);
  const [codes, setCodes] = useState([]);
  const [changeColor, setChangeColor] = useState(null);

  const showColors = true;

  useEffect(() => {
    if (!codingjob) return null;
    loadCodes(codingjob, setCodes, setSettings);
  }, [codingjob]);

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
        changeCodeColor(codingjob, changeColor.code, changeColor.color, codes, setCodes);
      }
      setChangeColor(null);
    }, 500);
    return () => clearTimeout(timer);
  }, [codingjob, codes, setCodes, changeColor, setChangeColor]);

  const formatCode = (code) => {
    const color = code.active == null || code.active ? "black" : "grey";
    if (code.level === 0) return { fontWeight: "bold", fontSize: "15px", color };
    if (code.level === 1) return { fontSize: "12px", color };
    if (code.level === 2) return { fontSize: "10px", color };
    return { fontSize: "10px", color };
  };

  return (
    <Table singleLine columns={2} textAlign="left" style={{ border: "0", boxShadow: "0" }}>
      <Table.Header className="codes-thead"></Table.Header>
      <Table.Body
        style={{ height: height, margin: "0", border: "1px solid" }}
        className="codes-tbody"
      >
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
                <span style={{ ...formatCode(code), marginLeft: `${2 * code.level}em` }}>
                  <EditCodePopup
                    codingjob={codingjob}
                    codeMap={codeMap}
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
          codeMap={codeMap}
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

import React, { useEffect, useState } from "react";
import { Checkbox, Icon, Table } from "semantic-ui-react";
import { codeBookEdgesToMap, getCodeTreeArray } from "util/codebook";
import EditCodePopup from "./EditCodePopup";

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

  const formatCode = code => {
    const color = code.active == null || code.active ? "black" : "grey";
    if (code.level === 0) return { fontWeight: "bold", fontSize: "15px", color };
    if (code.level === 1) return { fontSize: "12px", color };
    if (code.level === 2) return { fontSize: "10px", color };
    return { fontSize: "10px", color };
  };

  return (
    <div style={{ overflow: "auto" }}>
      <Table
        singleLine
        columns={2}
        unstackable
        textAlign="left"
        style={{ border: "0", boxShadow: "0", width: "100%" }}
      >
        <Table.Header className="codes-thead"></Table.Header>
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
                    borderRight: code.active == null ? null : "1px solid black",
                    backgroundColor: code.color && code.active ? code.color : "white",
                  }}
                >
                  {code.active == null ? null : (
                    <Checkbox
                      checked={code.active && code.activeParent}
                      style={{ transform: "scale(0.9)", width: "100%" }}
                      onChange={(e, d) => {
                        toggleActiveCode(codes, code.code, d.checked, setCodes);
                      }}
                    />
                  )}
                </Table.Cell>

                <Table.Cell
                  className="codes-td"
                  style={{
                    borderTop: code.level === 0 ? "1px solid black" : null,
                    //borderBottom: code.level === 0 ? "1px solid black" : null,
                  }}
                >
                  <span style={{ ...formatCode(code), marginLeft: `${2 * code.level}em` }}>
                    <EditCodePopup
                      codeMap={codeMap}
                      code={code}
                      codes={codes}
                      setCodes={setCodes}
                      setChangeColor={setChangeColor}
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
            codeMap={codeMap}
            code={""}
            codes={codes}
            setCodes={setCodes}
            setChangeColor={setChangeColor}
          >
            <Icon name="cog" style={{ marginLeft: "0.7em", cursor: "pointer" }} />
          </EditCodePopup>
        </Table.Body>
      </Table>
    </div>
  );
};

const changeCodeColor = (code, color, codes, setCodes) => {
  let updatedCodes = codes.map(ucode => {
    if (ucode.code === code) ucode.color = color;
    return ucode;
  });
  setCodes(updatedCodes);
};

const toggleActiveCode = (codes, code, active, setCodes) => {
  let updatedCodes = [...codes];

  const selectedCode = updatedCodes.find(ucode => ucode.code === code);

  // there is a possibility that code.code does not exist, if it only existed as a parent
  // this is ideally resolved upstream (when creating the codebook), but as a plan B it can be added here
  if (selectedCode) {
    selectedCode.active = active;
  } else updatedCodes.push({ code: code, parent: "", active: true });

  setCodes(updatedCodes);
};

const toggleFoldCode = (codes, code, folded, setCodes) => {
  let updatedCodes = [...codes];

  const selectedCode = updatedCodes.find(ucode => ucode.code === code);

  // there is a possibility that code.code does not exist, if it only existed as a parent
  // this is ideally resolved upstream (when creating the codebook), but as a plan B it can be added here
  if (selectedCode) {
    selectedCode.folded = !folded;
  } else updatedCodes.push({ code: code, parent: "", active: true, folded: !folded });

  setCodes(updatedCodes);
};

export default CodesEditor;

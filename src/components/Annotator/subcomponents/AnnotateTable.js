import React from "react";
import { Table } from "semantic-ui-react";
import { getColor } from "library/tokenDesign";
import "components/Document/subcomponents/spanAnnotationsStyle.css";

const COLWIDTHS = [4, 4, 2, 2]; // for offset and text

const AnnotateTable = ({ variableMap, annotations }) => {
  if (!variableMap || Object.keys(variableMap).length === 0) return null;
  return (
    <Table
      style={{ fontSize: "10px" }}
      fixed
      role="grid"
      arioa-labelledby="header"
      unstackable
      singleLine
      compact="very"
      size="small"
    >
      <Table.Header className="annotations-thead">
        <Table.Row>
          <Table.HeaderCell width={COLWIDTHS[0]}>Variable</Table.HeaderCell>
          <Table.HeaderCell width={COLWIDTHS[1]}>Value</Table.HeaderCell>
          <Table.HeaderCell width={COLWIDTHS[2]}>Section</Table.HeaderCell>
          <Table.HeaderCell width={COLWIDTHS[3]}>Tokens</Table.HeaderCell>
          <Table.HeaderCell>Text</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body className="annotations-tbody">
        {annotationRows(variableMap, annotations)}
      </Table.Body>
    </Table>
  );
};

const annotationRows = (variableMap, annotations) => {
  const rows = [];
  let i = 0;
  for (const annotation of annotations) {
    const text = annotation.text || "";

    const row = (
      <AnnotationRow
        key={i}
        variable={annotation.variable}
        variableMap={variableMap}
        annotation={annotation}
        text={text}
      />
    );
    rows.push(row);
    i++;
  }
  return rows;
};

const AnnotationRow = ({ variable, variableMap, annotation, text }) => {
  if (!variableMap) return null;

  const codeMap = variableMap[variable].codeMap;
  const color = getColor(annotation.value, codeMap);
  const label = codeMap[annotation.value]?.foldToParent
    ? `${codeMap[annotation.value].foldToParent} - ${annotation.value}`
    : annotation.value;

  return (
    <Table.Row className="annotations-tr">
      <Table.Cell width={COLWIDTHS[0]}>
        <span title={variable}>{variable}</span>
      </Table.Cell>

      <Table.Cell width={COLWIDTHS[1]} style={color ? { background: color } : null}>
        <span title={label}>{label}</span>
      </Table.Cell>
      <Table.Cell width={COLWIDTHS[2]}>{annotation.section}</Table.Cell>
      <Table.Cell width={COLWIDTHS[3]}>{`${annotation.offset}-${
        annotation.offset + annotation.length
      }`}</Table.Cell>
      <Table.Cell>
        <span title={text}>{text}</span>
      </Table.Cell>
    </Table.Row>
  );
};

export default AnnotateTable;

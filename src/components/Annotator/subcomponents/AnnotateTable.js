import React, { useRef } from "react";
import { Ref, Table } from "semantic-ui-react";
import { getColor } from "util/tokenDesign";
import { importSpanAnnotations } from "util/annotations";
import "components/Document/subcomponents/spanAnnotationsStyle.css";

const COLWIDTHS = [4, 4, 2, 2]; // for offset and text

const AnnotateTable = ({ tokens, variableMap, annotations }) => {
  if (!tokens || tokens.length === 0 || !variableMap || Object.keys(variableMap).length === 0)
    return null;
  console.log(variableMap);
  return (
    <Table
      style={{ fontSize: "10px" }}
      fixed
      role="grid"
      arioa-labelledby="header"
      selectable
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
        {annotationRows(tokens, variableMap, importSpanAnnotations(annotations, tokens))}
      </Table.Body>
    </Table>
  );
};

const annotationRows = (tokens, variableMap, annotations) => {
  const rows = [];
  let text = null;
  let annotation = null;

  for (const tokenIndex of Object.keys(annotations)) {
    for (const variable of Object.keys(annotations[tokenIndex])) {
      annotation = annotations[tokenIndex][variable];

      // annotations are stored percode token index, and so are duplicated
      // to get unique annotations we only use the first one.
      if (annotation.index !== annotation.span[0]) continue;

      // negative offset, so that index/span matches array indices (more efficient)
      const offset = -tokens[0].index;
      //const span = [annotation.span[0] - tokens[0].index, annotation.span[1] - tokens[0].index];

      let notInUnit = true;
      for (let span_i = annotation.span[0]; span_i <= annotation.span[1]; span_i++) {
        if (tokens[span_i + offset] != null && tokens[span_i + offset].codingUnit)
          notInUnit = false;
      }

      if (notInUnit) continue;

      const annotationTokens = tokens.slice(
        annotation.span[0] + offset,
        annotation.span[1] + 1 + offset
      );
      text = annotationTokens
        .map((at, i) => {
          const pre = i > 0 ? at.pre : "";
          const post = i < annotationTokens.length - 1 ? at.post : "";
          return pre + at.text + post;
        })
        .join("");

      const row = (
        <AnnotationRow
          key={tokenIndex + annotation.value}
          tokens={tokens}
          variable={variable}
          variableMap={variableMap}
          annotation={annotation}
          text={text}
          offset={offset}
        />
      );
      rows.push(row);
    }
  }
  return rows;
};

const AnnotationRow = ({ tokens, variable, variableMap, annotation, text, offset }) => {
  const ref = useRef();

  if (!variableMap) return null;

  const codeMap = variableMap[variable].codeMap;
  const color = getColor(annotation.value, codeMap);
  const label = codeMap[annotation.value]?.foldToParent
    ? `${codeMap[annotation.value].foldToParent} - ${annotation.value}`
    : annotation.value;

  return (
    <Ref innerRef={ref}>
      <Table.Row className="annotations-tr">
        <Table.Cell width={COLWIDTHS[0]}>
          <span title={variable}>{variable}</span>
        </Table.Cell>

        <Table.Cell width={COLWIDTHS[1]} style={color ? { background: color } : null}>
          <span title={label}>{label}</span>
        </Table.Cell>
        <Table.Cell width={COLWIDTHS[2]}>{annotation.section}</Table.Cell>
        <Table.Cell width={COLWIDTHS[3]} cref={ref}>
          {`${annotation.span[0]}-${annotation.span[1]}`}
        </Table.Cell>
        <Table.Cell>
          <span title={text}>{text}</span>
        </Table.Cell>
      </Table.Row>
    </Ref>
  );
};

export default AnnotateTable;

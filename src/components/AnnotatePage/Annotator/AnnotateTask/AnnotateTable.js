import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Ref, Table } from "semantic-ui-react";
import { triggerCodeselector } from "actions";
import { getColor } from "util/tokenDesign";
import "components/spanAnnotationsStyle.css";

const COLWIDTHS = [4, 2, 2]; // for offset and text

const AnnotateTable = ({ taskItem }) => {
  const annotations = useSelector((state) => state.annotations.span);

  if (!taskItem.tokens || taskItem.tokens.length === 0) return null;
  if (!taskItem.writable) return null;

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
          <Table.HeaderCell width={COLWIDTHS[0]}>Code</Table.HeaderCell>
          <Table.HeaderCell width={COLWIDTHS[1]}>Section</Table.HeaderCell>
          <Table.HeaderCell width={COLWIDTHS[2]}>Tokens</Table.HeaderCell>
          <Table.HeaderCell>Text</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body className="annotations-tbody">
        {annotationRows(taskItem.tokens, annotations)}
      </Table.Body>
    </Table>
  );
};

const annotationRows = (tokens, annotations) => {
  const rows = [];
  let text = null;
  let annotation = null;

  for (const tokenIndex of Object.keys(annotations)) {
    for (const code of Object.keys(annotations[tokenIndex])) {
      annotation = annotations[tokenIndex][code];

      // annotations are stored per token index, and so are duplicated
      // to get unique annotations we only use the first one.
      if (annotation.index !== annotation.span[0]) continue;

      // negative offset, so that index/span matches array indices (more efficient)
      const offset = -tokens[0].index;
      //const span = [annotation.span[0] - tokens[0].index, annotation.span[1] - tokens[0].index];

      let notInUnit = true;
      for (let span_i = annotation.span[0]; span_i <= annotation.span[1]; span_i++) {
        if (tokens[span_i + offset] != null && tokens[span_i + offset].textPart === "textUnit")
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
          key={tokenIndex + code}
          tokens={tokens}
          annotation={annotation}
          code={code}
          text={text}
          offset={offset}
        />
      );
      rows.push(row);
    }
  }
  return rows;
};

const AnnotationRow = ({ tokens, annotation, code, text, offset }) => {
  const codeMap = useSelector((state) => state.codeMap);
  const infocus = useSelector((state) => {
    let currentIndex = tokens[state.currentToken]?.index; // currentToken is the arrayIndex
    if (!currentIndex) return null;
    return currentIndex >= annotation.span[0] && currentIndex <= annotation.span[1];
  });

  const ref = useRef();
  const dispatch = useDispatch();

  useEffect(() => {
    if (infocus) {
      if (ref.current) {
        ref.current.style.backgroundColor = "grey";
        ref.current.scrollIntoView(false, {
          block: "nearest",
        });
      }
    } else {
      if (ref.current) ref.current.style.backgroundColor = null;
    }
  }, [infocus]);

  const color = getColor(code, codeMap);
  const label = codeMap[code]?.foldToParent ? `${codeMap[code].foldToParent} - ${code}` : code;

  return (
    <Ref innerRef={ref}>
      <Table.Row
        className="annotations-tr"
        onClick={() => {
          tokens[annotation.index + offset].ref.current.scrollIntoView(false, { block: "center" });
          dispatch(triggerCodeselector(null, null, null));
          dispatch(triggerCodeselector("menu", annotation.index, code));
        }}
        onMouseOver={() => {
          //dispatch(setTokenSelection(token.span));
          //tokens[token.index].ref.current.scrollIntoView(false);
        }}
      >
        <Table.Cell width={COLWIDTHS[0]} style={color ? { background: color } : null}>
          <span title={label}>{label}</span>
        </Table.Cell>
        <Table.Cell width={COLWIDTHS[1]}>{annotation.section}</Table.Cell>
        <Table.Cell width={COLWIDTHS[2]} cref={ref}>
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

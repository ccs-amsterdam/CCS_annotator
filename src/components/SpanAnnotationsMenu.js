import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Ref, Table } from "semantic-ui-react";
import { triggerCodeselector } from "../actions";
import { getColor } from "../util/tokenDesign";
import "./spanAnnotationsStyle.css";

const COLWIDTHS = [4, 2, 2]; // for offset and text

const SpanAnnotationsMenu = ({ tokens, doc }) => {
  const annotations = useSelector((state) => state.spanAnnotations);

  if (!tokens || tokens.length === 0) return null;
  if (!doc.writable) return null;

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
      <Table.Body className="annotations-tbody">{annotationRows(tokens, annotations)}</Table.Body>
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

      if (annotation.index !== annotation.span[0]) continue;
      let notInUnit = true;
      for (let span_i = annotation.span[0]; span_i <= annotation.span[1]; span_i++) {
        if (tokens[span_i].textPart === "codingUnit") notInUnit = false;
      }

      if (notInUnit) continue;

      const annotationTokens = tokens.slice(annotation.span[0], annotation.span[1] + 1);
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
        />
      );
      rows.push(row);
    }
  }
  return rows;
};

const AnnotationRow = ({ tokens, annotation, code, text }) => {
  const codeMap = useSelector((state) => state.codeMap);
  const infocus = useSelector((state) => {
    return state.currentToken >= annotation.span[0] && state.currentToken <= annotation.span[1];
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

  return (
    <Ref innerRef={ref}>
      <Table.Row
        className="annotations-tr"
        onClick={() => {
          tokens[annotation.index].ref.current.scrollIntoView(false, { block: "center" });
          dispatch(triggerCodeselector(null, null, null));
          dispatch(triggerCodeselector("menu", annotation.index, code));
        }}
        onMouseOver={() => {
          //dispatch(setTokenSelection(token.span));
          //tokens[token.index].ref.current.scrollIntoView(false);
        }}
      >
        <Table.Cell width={COLWIDTHS[0]} style={color ? { background: color } : null}>
          <span title={code}>{code}</span>
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

export default SpanAnnotationsMenu;

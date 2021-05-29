import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Ref, Table } from "semantic-ui-react";
import { triggerCodeselector } from "../actions";
import "./spanAnnotationsStyle.css";

const COLWIDTHS = [4, 2, 2]; // for offset and text

const SpanAnnotationsMenu = ({ doc, tokens }) => {
  const annotations = useSelector(state => state.spanAnnotations);

  if (!tokens) return null;

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
          <Table.HeaderCell width={COLWIDTHS[2]}>Span</Table.HeaderCell>
          <Table.HeaderCell>Text</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body className="annotations-tbody">
        {annotationRows(tokens, doc, annotations)}
      </Table.Body>
    </Table>
  );
};

const annotationRows = (tokens, doc, annotations) => {
  const rows = [];

  for (const tokenIndex of Object.keys(annotations)) {
    for (const code of Object.keys(annotations[tokenIndex])) {
      const token = annotations[tokenIndex][code];
      if (token.index !== token.span[0]) continue;
      const text = doc[token.section].slice(token.offset, token.offset + token.length);

      const row = (
        <AnnotationRow
          key={tokenIndex + code}
          tokens={tokens}
          token={token}
          code={code}
          text={text}
        />
      );
      rows.push(row);
    }
  }
  return rows;
};

const AnnotationRow = ({ tokens, token, code, text }) => {
  const codeMap = useSelector(state => state.codeMap);
  const infocus = useSelector(state => {
    return state.currentToken >= token.span[0] && state.currentToken <= token.span[1];
  });

  const ref = useRef();
  const dispatch = useDispatch();

  useEffect(() => {
    if (infocus) {
      if (ref.current) {
        ref.current.style.backgroundColor = "grey";
        ref.current.scrollIntoView(false, {
          block: "start",
        });
      }
    } else {
      if (ref.current) ref.current.style.backgroundColor = null;
    }
  }, [infocus]);

  const getColor = (annotationCode, codeMap) => {
    if (codeMap[annotationCode]) {
      return codeMap[annotationCode].color;
    } else {
      return "lightgrey";
    }
  };
  const color = getColor(code, codeMap);

  return (
    <Ref innerRef={ref}>
      <Table.Row
        className="annotations-tr"
        onClick={() => {
          tokens[token.index].ref.current.scrollIntoView(false);
          dispatch(triggerCodeselector(null, null, null));
          dispatch(triggerCodeselector("menu", token.index, code));
        }}
        onMouseOver={() => {
          //dispatch(setTokenSelection(token.span));
          //tokens[token.index].ref.current.scrollIntoView(false);
        }}
      >
        <Table.Cell width={COLWIDTHS[0]} style={color ? { background: color } : null}>
          <span title={code}>{code}</span>
        </Table.Cell>
        <Table.Cell width={COLWIDTHS[1]}>{token.section}</Table.Cell>
        <Table.Cell width={COLWIDTHS[2]} cref={ref}>
          {`${token.offset}-${token.offset + token.length}`}
        </Table.Cell>
        <Table.Cell>
          <span title={text}>{text}</span>
        </Table.Cell>
      </Table.Row>
    </Ref>
  );
};

export default SpanAnnotationsMenu;

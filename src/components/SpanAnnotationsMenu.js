import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Ref, Table } from "semantic-ui-react";
import { setTokenSelection, triggerCodeselector } from "../actions";

const SpanAnnotationsMenu = ({ doc, tokens }) => {
  const annotations = useSelector((state) => state.spanAnnotations);

  if (!tokens) return null;

  return (
    <Table
      celled
      selectable
      unstackable
      singleLine
      compact="very"
      size="small"
      style={{ marginLeft: "1em" }}
    >
      <Table.Header>
        <Table.HeaderCell collapsing>offset</Table.HeaderCell>
        <Table.HeaderCell collapsing>Code</Table.HeaderCell>
        <Table.HeaderCell collapsing>Text</Table.HeaderCell>
      </Table.Header>
      <Table.Body>{annotationRows(tokens, doc, annotations)}</Table.Body>
    </Table>
  );
};

const AnnotationRow = ({ tokens, token, code, text }) => {
  const codes = useSelector((state) => state.codes);
  const infocus = useSelector((state) => {
    return (
      state.currentToken >= token.span[0] && state.currentToken <= token.span[1]
    );
  });

  const ref = useRef();
  const dispatch = useDispatch();

  useEffect(() => {
    console.log(ref.current);
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

  const getColor = (annotationCode, codes) => {
    const codematch = codes.find((code) => code.code === annotationCode);
    if (codematch) {
      return codematch.color;
    } else {
      return "lightgrey";
    }
  };
  const color = getColor(code, codes);

  return (
    <Table.Row
      onClick={() => {
        dispatch(triggerCodeselector("menu", token.index, code));
      }}
      onMouseOver={() => {
        dispatch(setTokenSelection(token.span));
        tokens[token.index].ref.current.scrollIntoView(false);
      }}
    >
      <Ref innerRef={ref}>
        <Table.Cell collapsing ref={ref}>
          {token.offset}
        </Table.Cell>
      </Ref>
      <Table.Cell collapsing style={color ? { background: color } : null}>
        <span title={code}>{shortString(code)}</span>
      </Table.Cell>
      <Table.Cell collapsing>
        <span title={text}>{shortString(text)}</span>
      </Table.Cell>
    </Table.Row>
  );
};

const annotationRows = (tokens, doc, annotations) => {
  const rows = [];

  for (const tokenIndex of Object.keys(annotations)) {
    for (const code of Object.keys(annotations[tokenIndex])) {
      const token = annotations[tokenIndex][code];
      if (token.index !== token.span[0]) continue;
      const text = doc.text.slice(token.offset, token.offset + token.length);

      const row = (
        <AnnotationRow tokens={tokens} token={token} code={code} text={text} />
      );
      rows.push(row);
    }
  }
  return rows;
};

const shortString = (string, n = 20) => {
  if (!string) return null;
  if (string.length < n) return string;
  return string.slice(0, n) + "...";
};

export default SpanAnnotationsMenu;

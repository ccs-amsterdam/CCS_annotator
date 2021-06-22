import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Container, Pagination, Table, Icon } from "semantic-ui-react";
import db from "../apis/dexie";

const PAGESIZE = 10;

const DocumentTable = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const [data, setData] = useState([]);
  const [pages, setPages] = useState(1);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    if (!codingjob) {
      setData([]);
      setColumns([]);
      return null;
    }
    fetchFromDb(codingjob, PAGESIZE, setPages, setData, setColumns);
  }, [codingjob]);

  const createHeaderRow = (data, columns) => {
    return columns.map((colname, i) => {
      return (
        <Table.HeaderCell key={i} width={i === 0 ? 3 : null}>
          <span title={colname}>{colname}</span>
        </Table.HeaderCell>
      );
    });
  };

  const createBodyRows = (data) => {
    return data.map((rowObj, i) => {
      return <Table.Row key={i}>{createRowCells(rowObj)}</Table.Row>;
    });
  };

  const tokensToText = (tokens, section) => {
    return tokens.reduce((text, token) => {
      if (token.section === section) text = text + token.pre + token.token + token.post;
      return text;
    }, "");
  };

  const createRowCells = (rowObj) => {
    return columns.map((key, i) => {
      let content = null;
      if (key === "document_id") {
        content = rowObj.document_id;
      } else {
        if (rowObj.text_fields) {
          content = rowObj.text_fields.find((tf) => tf.name === key);
          if (content) content = content.value;
        }
        if (!content && !rowObj.text_fields && rowObj.tokens) {
          content = tokensToText(rowObj.tokens, key);
        }
      }

      return (
        <Table.Cell key={i}>
          <span title={content}>{content}</span>
        </Table.Cell>
      );
    });
  };

  const pageChange = async (event, data) => {
    const offset = (data.activePage - 1) * PAGESIZE;
    const newdata = await db.getJobDocuments(codingjob, offset, PAGESIZE);
    setData(newdata);
    setColumns(getColumns(newdata));
  };

  if (data.length < 1) return null;

  return (
    <Container style={{ marginTop: "2em" }}>
      <Table selectable fixed compact singleLine size="small" style={{ fontSize: "10px" }}>
        <Table.Header>
          <Table.Row>{createHeaderRow(data, columns)}</Table.Row>
        </Table.Header>
        <Table.Body>{createBodyRows(data)}</Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan={columns.length}>
              {pages > 1 ? (
                <Pagination
                  size="mini"
                  floated="right"
                  boundaryRange={1}
                  siblingRange={1}
                  ellipsisItem={{
                    content: <Icon name="ellipsis horizontal" />,
                    icon: true,
                  }}
                  firstItem={{
                    content: <Icon name="angle double left" />,
                    icon: true,
                  }}
                  lastItem={{
                    content: <Icon name="angle double right" />,
                    icon: true,
                  }}
                  prevItem={{ content: <Icon name="angle left" />, icon: true }}
                  nextItem={{
                    content: <Icon name="angle right" />,
                    icon: true,
                  }}
                  pointing
                  secondary
                  defaultActivePage={1}
                  totalPages={pages}
                  onClick={() => console.log("wtf")}
                  onPageChange={pageChange}
                ></Pagination>
              ) : null}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </Container>
  );
};

const fetchFromDb = async (codingjob, pageSize, setPages, setData, setColumns) => {
  const n = await db.getJobDocumentCount(codingjob);
  setPages(Math.ceil(n / pageSize));
  let newdata = [];
  if (n > 0) newdata = await db.getJobDocuments(codingjob, 0, pageSize);

  setData(newdata);
  setColumns(getColumns(newdata));
};

const getColumns = (newdata) => {
  let newcolumns = [];
  if (newdata.length > 0) {
    newcolumns = newdata.reduce((s, row) => {
      if (row.text_fields) {
        for (let tf of row.text_fields) s.add(tf.name);
      } else {
        for (let i = 0; i < row.tokens.length; i++) s.add(row.tokens[i].section);
      }
      return s;
    }, new Set());
  }
  return ["document_id", ...newcolumns];
};

export default DocumentTable;

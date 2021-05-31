import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Container, Pagination, Table, Icon } from "semantic-ui-react";
import db from "../apis/dexie";

const PAGESIZE = 10;
const COLUMNS = ["title", "text", "meta"];

const fetchFromDb = async (codingjob, pageSize, setPages, setData) => {
  const n = await db.getJobDocumentCount(codingjob);
  setPages(Math.ceil(n / pageSize));
  let newdata = [];
  if (n > 0) newdata = await db.getJobDocumentsBatch(codingjob, 0, pageSize);
  setData(newdata);
};

const DocumentTable = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const [data, setData] = useState([]);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    if (!codingjob) {
      setData([]);
      return null;
    }
    fetchFromDb(codingjob, PAGESIZE, setPages, setData);
  }, [codingjob]);

  const createHeaderRow = (data) => {
    return COLUMNS.map((colname, i) => {
      return (
        <Table.HeaderCell key={i}>
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

  const createRowCells = (rowObj) => {
    return COLUMNS.map((key, i) => {
      let content = rowObj[key];
      if (key === "text" && !rowObj[key] && rowObj.tokens)
        content = rowObj.tokens.map((token) => token.token || token.text).join(" ");
      return (
        <Table.Cell key={i}>
          <span title={content}>{content}</span>
        </Table.Cell>
      );
    });
  };

  const pageChange = async (event, data) => {
    const offset = (data.activePage - 1) * PAGESIZE;
    const newdata = await db.getJobDocumentsBatch(codingjob, offset, PAGESIZE);
    setData(newdata);
  };

  if (data.length < 1) return null;

  return (
    <Container style={{ marginTop: "2em" }}>
      <Table fixed compact celled singleLine>
        <Table.Header>
          <Table.Row>{createHeaderRow(data)}</Table.Row>
        </Table.Header>
        <Table.Body>{createBodyRows(data)}</Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan={COLUMNS.length}>
              {pages > 1 ? (
                <Pagination
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

export default DocumentTable;

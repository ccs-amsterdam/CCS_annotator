import React from "react";
import { Container, Pagination, Table, Icon } from "semantic-ui-react";

/**
 * A nice table with pagination
 * @param {array} data an Array with data for a single page
 * @param {array} columns an Array with objects indicating which columns to show and how
 * @param {int} pages the number of pages
 * @param {function} pageChange the function to perform on pagechange. Gets pageindex as an argument, and should update data
 * @returns
 */
const PaginationTable = ({ data, columns, pages, pageChange }) => {
  const createHeaderRow = (data, columns) => {
    return columns.map((col, i) => {
      return (
        <Table.HeaderCell key={i} width={col.width || null}>
          <span title={col.name}>{col.name}</span>
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
    return columns.map((col, i) => {
      let content = rowObj[col.name];
      return (
        <Table.Cell key={i}>
          <span title={content}>{content}</span>
        </Table.Cell>
      );
    });
  };

  if (data.length < 1) return null;

  return (
    <Container>
      <Table
        unstackable
        selectable
        fixed
        compact
        singleLine
        size="small"
        style={{ fontSize: "10px" }}
      >
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
                  onPageChange={(e, d) => pageChange(d.activePage)}
                ></Pagination>
              ) : null}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </Container>
  );
};

export default PaginationTable;

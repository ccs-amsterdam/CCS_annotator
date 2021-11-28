import React from "react";
import { useTable, useSortBy, usePagination, useGlobalFilter } from "react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Pagination,
  Icon,
  Checkbox,
} from "semantic-ui-react";

// Uses react-table with semantic ui. The columns and data arguments are lists of objects
// The 'columns' argument specifies column names (Header) and the names of the keys to get from data.
//
// const columns = [
//   { Header: "ID", accessor: "id", headerClass: "one wide" },
//   { Header: "Name", accessor: "text", headerClass: "one wide" },
// ]
//
// Note that headerClass is custom, and enables setting the header cell class,
// which is used in semantic ui to specify the width (one wide, ten wide, etc).

const CheckboxTable = ({ columns, data, setData, width = null, defaultSize = 10 }) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    pageCount,
    gotoPage,
    preGlobalFilteredRows,
    setGlobalFilter,
    state: { pageIndex, globalFilter },
  } = useTable(
    {
      columns,
      data,
      initialState: {
        pageIndex: 0,
        pageSize: defaultSize,
        globalFilter: "",
      },
      autoResetPage: false,
    },

    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const createHeader = (headerGroup) => {
    const checkboxHeader = <TableHeaderCell width={3}>Include</TableHeaderCell>;
    const headers = headerGroup.headers.map((column) => {
      return (
        <TableHeaderCell
          className={column.headerClass}
          {...column.getHeaderProps(column.getSortByToggleProps())}
        >
          {column.render("Header")}
          <span>{column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}</span>
        </TableHeaderCell>
      );
    });
    return [checkboxHeader, ...headers];
  };

  const onCheck = (index) => {
    data[index].valid = !data[index].valid;
    setData(data);
  };

  const createBody = (page) => {
    return page.map((row, i) => {
      prepareRow(row);
      return (
        <TableRow onClick={() => onCheck(row.index)} {...row.getRowProps()}>
          <TableCell style={{ padding: "1px 5px" }}>
            <Checkbox toggle checked={row.original.valid} />
          </TableCell>
          {row.cells.map((cell) => {
            return (
              <TableCell title={cell.value} {...cell.getCellProps()} style={{ padding: "1px 5px" }}>
                {cell.render("Cell")}
              </TableCell>
            );
          })}
        </TableRow>
      );
    });
  };

  //if (data.length === 0) return null;

  return (
    <div style={{ width: width }}>
      <GlobalFilter
        preGlobalFilteredRows={preGlobalFilteredRows}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      <Table
        compact
        unstackable
        fixed
        singleLine
        selectable
        {...getTableProps()}
        size="small"
        style={{ fontSize: "10px", overflowY: "auto" }}
      >
        <TableHeader>
          {headerGroups.map((headerGroup) => (
            <TableRow {...headerGroup.getHeaderGroupProps()}>{createHeader(headerGroup)}</TableRow>
          ))}
        </TableHeader>
        <TableBody {...getTableBodyProps()}>{createBody(page)}</TableBody>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan={columns.length + 1}>
              {data.length > defaultSize ? (
                <Pagination
                  floated="right"
                  style={{ border: "0" }}
                  size="mini"
                  firstItem={false}
                  lastItem={false}
                  nextItem={false}
                  prevItem={false}
                  boundaryRange={1}
                  ellipsisItem={{
                    content: <Icon name="ellipsis horizontal" />,
                    icon: true,
                  }}
                  activePage={pageIndex + 1}
                  totalPages={pageCount}
                  onPageChange={(event, data) => {
                    gotoPage(data.activePage - 1);
                  }}
                />
              ) : null}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </div>
  );
};

const GlobalFilter = ({ preGlobalFilteredRows, globalFilter, setGlobalFilter }) => {
  //const count = preGlobalFilteredRows && preGlobalFilteredRows.length;

  return (
    <span>
      <input
        value={globalFilter || ""}
        onChange={(e) => {
          setGlobalFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
        }}
        placeholder={`Enter search term`}
        style={{
          border: "0",
        }}
      />
    </span>
  );
};

export default CheckboxTable;

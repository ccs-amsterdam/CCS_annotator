import React, { useEffect, useState } from "react";
import {
  useTable,
  useSortBy,
  usePagination,
  useGlobalFilter,
} from "react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Pagination,
  Dropdown,
  Icon,
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

const SelectionTable = ({
  columns,
  data,
  selectedRow,
  setSelectedRow,
  width = null,
  defaultSize = 15,
  sizeSelector = false,
}) => {
  const [activeRow, setActiveRow] = useState(
    selectedRow ? selectedRow.ROW_ID : null
  );
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    pageCount,
    gotoPage,
    setPageSize,
    preGlobalFilteredRows,
    setGlobalFilter,
    state: { pageIndex, globalFilter },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageSize: defaultSize, globalFilter: "" },
    },

    useGlobalFilter,
    useSortBy,
    usePagination
  );

  useEffect(() => {
    if (selectedRow) {
      setActiveRow(selectedRow.ROW_ID);
    } else {
      setActiveRow(null);
    }
  }, [selectedRow]);

  const onRowSelect = (row) => {
    if (activeRow && activeRow === row.id) {
      setSelectedRow(null);
      setActiveRow(null);
    } else {
      setSelectedRow({ ...data[row.id], ROW_ID: row.id });
      setActiveRow(row.id);
    }
  };

  const createHeader = (headerGroup) => {
    return headerGroup.headers.map((column) => {
      return (
        <TableHeaderCell
          className={column.headerClass}
          {...column.getHeaderProps(column.getSortByToggleProps())}
        >
          {column.render("Header")}
          <span>
            {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
          </span>
        </TableHeaderCell>
      );
    });
  };

  const createBody = (page) => {
    return page.map((row, i) => {
      prepareRow(row);
      return (
        <TableRow
          active={activeRow ? activeRow === row.id : false}
          onClick={() => onRowSelect(row)}
          {...row.getRowProps()}
        >
          {row.cells.map((cell) => {
            return (
              <TableCell title={cell.value} {...cell.getCellProps()}>
                {cell.render("Cell")}
              </TableCell>
            );
          })}
        </TableRow>
      );
    });
  };

  if (data.length === 0) return null;

  return (
    <div style={{ width: width }}>
      <GlobalFilter
        preGlobalFilteredRows={preGlobalFilteredRows}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      <Table
        unstackable
        striped
        fixed
        singleLine
        selectable
        {...getTableProps()}
      >
        <TableHeader>
          {headerGroups.map((headerGroup) => (
            <TableRow {...headerGroup.getHeaderGroupProps()}>
              {createHeader(headerGroup)}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody {...getTableBodyProps()}>{createBody(page)}</TableBody>
      </Table>
      {sizeSelector ? (
        <Dropdown
          text="show per page"
          options={[10, 25, 50, 100, 500].map((n) => ({ value: n, text: n }))}
          onChange={(e, d) => {
            setPageSize(d.value);
          }}
        />
      ) : null}
      <div
        style={{
          marginTop: "3em",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        {data.length > defaultSize ? (
          <Pagination
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
      </div>
    </div>
  );
};

const GlobalFilter = ({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}) => {
  const count = preGlobalFilteredRows && preGlobalFilteredRows.length;

  return (
    <span>
      <input
        value={globalFilter || ""}
        onChange={(e) => {
          setGlobalFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
        }}
        placeholder={`Search ${count} records...`}
        style={{
          border: "0",
        }}
      />
    </span>
  );
};

export default SelectionTable;

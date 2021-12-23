import React, { useEffect, useState } from "react";
import { Container, Pagination, Table, Icon, Input } from "semantic-ui-react";
import db from "apis/dexie";
import { useLiveQuery } from "dexie-react-hooks";

const PAGESIZE = 10;

/**
 * A table that (efficiently) shows a Dexie table (indexedDB), with pagination, search, and selection
 */
const DexieTable = ({
  table,
  columns,
  allColumns,
  idColumn = "id",
  setSelected,
  searchColumn,
  reverse,
}) => {
  // table from db
  // columns is array of objects with name (of field) and width
  // allColumns is bool for whether or not to include the rest of the columns
  const tableUpdated = useLiveQuery(() => db.idb.table(table).toCollection().keys());

  const [data, setData] = useState([]);
  const [pages, setPages] = useState(1);
  const [useColumns, setUseColumns] = useState(columns);
  const [search, setSearch] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    if (!table) {
      setData([]);
      return null;
    }
    fetchFromDb(
      table,
      PAGESIZE,
      setPages,
      setData,
      setSelectedRow,
      columns,
      allColumns,
      setUseColumns,
      search,
      reverse
    );
  }, [table, columns, allColumns, search, tableUpdated, setSelectedRow, reverse]);

  useEffect(() => {
    if (setSelected) setSelected(selectedRow);
  }, [selectedRow, setSelected]);

  const addSearchColumn = (name) => {
    if (name !== searchColumn) return name;
    return <QueryTable table={table} searchOn={name} setSearch={setSearch} />;
  };

  const createHeaderRow = () => {
    return useColumns.map((column, i) => {
      if (column.hide) return null;
      return (
        <Table.HeaderCell key={i} width={column.width}>
          <span title={column.name}>{addSearchColumn(column.name)}</span>
        </Table.HeaderCell>
      );
    });
  };

  const createBodyRows = (data) => {
    if (data === null || data.length === 0) return null;

    //while (data.length < PAGESIZE) data.push(null);
    return data.map((rowObj, i) => {
      const isSelected = rowObj[idColumn] === selectedRow?.[idColumn];
      return (
        <Table.Row
          key={i}
          style={{ height: "3.1em" }}
          active={isSelected}
          onClick={() => setSelectedRow(rowObj)}
        >
          {createRowCells(rowObj)}
        </Table.Row>
      );
    });
  };

  const createRowCells = (rowObj) => {
    return useColumns.map((column, i) => {
      if (column.hide) return null;
      let content = rowObj ? rowObj[column.name] : null;
      if (content instanceof Date) content = content.toISOString().slice(0, 19).replace(/T/g, " ");
      return (
        <Table.Cell key={i}>
          <span title={content}>{content}</span>
        </Table.Cell>
      );
    });
  };

  const pageChange = async (event, data) => {
    const offset = (data.activePage - 1) * PAGESIZE;
    let newdata = null;
    if (search == null) {
      newdata = await db.getTableBatch(table, offset, PAGESIZE);
    } else {
      newdata = await db.getTableFromIds(table, search.slice(offset, offset + PAGESIZE));
    }
    setData(newdata);
  };

  if (!useColumns) return null;

  return (
    <Container style={{ overflow: "auto" }}>
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
            <Table.HeaderCell colSpan={columns.filter((col) => !col.hide).length}>
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

const fetchFromDb = async (
  table,
  pageSize,
  setPages,
  setData,
  setSelectedRow,
  columns,
  allColumns,
  setUseColumns,
  search,
  reverse
) => {
  let n = null;

  if (search == null) {
    n = await db.getTableN(table);
  } else {
    n = search.length;
  }

  setPages(Math.ceil(n / pageSize));
  let newdata = [];
  const useColumns = [...columns];

  if (n > 0) {
    if (search == null) {
      newdata = await db.getTableBatch(table, 0, pageSize, columns, reverse);
    } else {
      newdata = await db.getTableFromIds(table, search.slice(0, PAGESIZE), columns, reverse);
    }
    if (allColumns) addBatchColumns(useColumns, newdata); // pushes to useColumns
  }

  console.log(newdata);
  setUseColumns(useColumns);
  setData(newdata);
  if (newdata.length > 0) setSelectedRow(newdata[0]);
};

const addBatchColumns = (columns, data) => {
  const colnames = columns.map((col) => col.name);

  for (let row of data) {
    for (let cname of Object.keys(row)) {
      if (!colnames.includes(cname)) {
        colnames.push(cname);
        columns.push({ name: cname, width: 2 });
      }
    }
  }
};

const QueryTable = React.memo(({ table, searchOn, setSearch }) => {
  // table: what table in db
  // searchOn: what columns to search in
  // setSearch: parent hook

  const [text, setText] = useState("");
  const [searchStatus, setSearchStatus] = useState("none");

  useEffect(() => {
    const timer = setTimeout(() => {
      searchSelection(table, searchOn, text, setSearch, setSearchStatus);
    }, 500);
    return () => clearTimeout(timer);
  }, [table, text, setSearchStatus, searchOn, setSearch]);

  return (
    <>
      <Input
        loading={searchStatus === "searching"}
        value={text}
        icon="search"
        placeholder={searchOn}
        onChange={(e, d) => setText(d.value)}
      ></Input>
    </>
  );
});

const searchSelection = async (table, searchOn, text, setSearch, setSearchStatus) => {
  if (text === "") {
    setSearch(null);
    setSearchStatus("none");
    return;
  }
  setSearchStatus("searching");

  const search = await db.textSearch(table, [searchOn], text);
  setSearch(search);
  setSearchStatus("finished");
};

export default DexieTable;

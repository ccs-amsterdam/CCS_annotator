import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { Container, Header, Table } from 'semantic-ui-react';
import db from '../apis/dexie';


const fetchRows = async (db, setData) => {
  db.
}

const ApiTable = ({ getPage, pagenr, max_pagenr }) => {
  const [data, setData] = useState([])


  useEffect(() => {
  
    setData()
  })

  const createHeader = (data) => {
    return data[0].data.map((colname) => {
      return (
        <Table.HeaderCell>
          <span title={colname}>{colname}</span>
        </Table.HeaderCell>
      );
    });
  };

  const createRows = (data) => {
    return data.slice(1).map((row) => {
      return <Table.Row>{createRowCells(row.data)}</Table.Row>;
    });
  };

  const createRowCells = (row) => {
    return row.map((cell) => {
      return (
        <Table.Cell>
          <span title={cell}>{cell}</span>
        </Table.Cell>
      );
    });
  };

  if (data.length <= 1) return null;

  return (
    <Container style={{ marginTop: "2em" }}>
      <Table fixed singleLine basic="very">
        <Table.Header>
          <Table.Row>{createHeader(data)}</Table.Row>
        </Table.Header>
        <Table.Body>{createRows(data, n)}</Table.Body>
      </Table>
      {data.length > n ? (
        <Header align="center">{data.length - 1 - n} more rows</Header>
      ) : null}
    </Container>
  );
};

export ApiTable

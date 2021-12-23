import React, { useEffect, useState } from "react";
import PaginationTable from "./PaginationTable";
import db from "apis/dexie";

const PAGESIZE = 10;

const DocumentTable = ({ codingjob }) => {
  const [data, setData] = useState([]);
  const [pages, setPages] = useState(1);
  const [columns, setColumns] = useState([]);

  const pageChange = async (activePage) => {
    const offset = (activePage - 1) * PAGESIZE;
    const newdata = await db.getJobDocuments(codingjob, offset, PAGESIZE);

    const columns = getColumns(newdata);
    setData(addTextColumns(newdata, columns));
    setColumns(columns);
  };

  useEffect(() => {
    if (!codingjob) {
      setData([]);
      setColumns([]);
      return null;
    }
    fetchFromDb(codingjob, PAGESIZE, setPages, setData, setColumns);
  }, [codingjob]);

  return <PaginationTable data={data} pages={pages} columns={columns} pageChange={pageChange} />;
};

const tokensToText = (tokens, section) => {
  return tokens.reduce((text, token) => {
    if (token.section === section) text = text + token.pre + token.token + token.post;
    return text;
  }, "");
};

const addTextColumns = (data, columns) => {
  return data.map((rowObj) => {
    return columns.reduce((newRowObj, col) => {
      let content = rowObj[col.name];
      if (col.name === "document_id") {
        content = rowObj.document_id;
      } else {
        if (rowObj.text_fields) {
          content = rowObj.text_fields.find((tf) => tf.name === col.name);
          if (content) content = content.value;
        }
        if (!content && !rowObj.text_fields && rowObj.tokens) {
          content = tokensToText(rowObj.tokens, col.name);
        }
      }
      newRowObj[col.name] = content;
      return newRowObj;
    }, {});
  });
};

const fetchFromDb = async (codingjob, pageSize, setPages, setData, setColumns) => {
  const n = await db.getJobDocumentCount(codingjob);
  setPages(Math.ceil(n / pageSize));
  let newdata = [];
  if (n > 0) newdata = await db.getJobDocuments(codingjob, 0, pageSize);

  const columns = getColumns(newdata);
  console.log(addTextColumns(newdata, columns));

  setData(addTextColumns(newdata, columns));
  setColumns(columns);
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
  return ["document_id", ...newcolumns].map((name) => ({ name }));
};

export default DocumentTable;

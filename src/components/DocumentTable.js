import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import SelectionTable from "./SelectionTable";
import { selectDocument } from "../actions";

const documentTableColumns = [
  { Header: "title", accessor: "title", headerClass: "six wide" },
  { Header: "text", accessor: "text", headerClass: "four wide" },
  { Header: "annotations", accessor: "annotations", headerClass: "four wide" },
  { Header: "meta", accessor: "meta", headerClass: "four wide" },
];

const DocumentTable = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const document = useSelector((state) => state.document);
  const documents = useSelector((state) => state.documents);
  const dispatch = useDispatch();

  const [selectedRow, setSelectedRow] = useState(document);

  useEffect(() => {
    dispatch(selectDocument(selectedRow));
  }, [selectedRow, dispatch]);

  if (!codingjob) return null;

  return (
    <SelectionTable
      columns={documentTableColumns}
      data={documents}
      selectedRow={selectedRow}
      setSelectedRow={setSelectedRow}
      defaultSize={15}
    />
  );
};

export default DocumentTable;

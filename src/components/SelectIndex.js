import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Container } from "semantic-ui-react";
import { selectIndex, setIndices } from "../Actions";

import SelectionTable from "./SelectionTable";
import CreateIndexModal from "./CreateIndexModal";
import DeleteIndexModal from "./DeleteIndexModal";

const indicesTableColumns = [
  { Header: "Select Index", accessor: "name", headerClass: "thirteen wide" },
];

const SelectIndex = () => {
  const session = useSelector((state) => state.session);
  const indices = useSelector((state) => state.indices);
  const index = useSelector((state) => state.index);
  const dispatch = useDispatch();

  const [selectedRow, setSelectedRow] = useState(index);

  useEffect(() => {
    if (session && indices.length === 0)
      session.getIndices().then((res) => {
        dispatch(setIndices(res.data));
      });
  }, []);

  useEffect(() => {
    dispatch(selectIndex(selectedRow));
  }, [selectedRow, dispatch]);

  return (
    <Container selectIndex>
      <Button.Group widths="2">
        <CreateIndexModal />
        <DeleteIndexModal />
      </Button.Group>
      <SelectionTable
        columns={indicesTableColumns}
        data={indices}
        selectedRow={selectedRow}
        setSelectedRow={setSelectedRow}
        defaultSize={15}
      />
    </Container>
  );
};

export default SelectIndex;

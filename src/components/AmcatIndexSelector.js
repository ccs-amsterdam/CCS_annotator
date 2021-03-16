import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Container } from "semantic-ui-react";
import { selectAmcatIndex, setAmcatIndices } from "../Actions";

import SelectionTable from "./SelectionTable";
import CreateAmcatIndex from "./CreateAmcatIndex";
import DeleteAmcatIndex from "./DeleteAmcatIndex";

const AmcatIndexSelector = ({ type = "table" }) => {
  const amcat = useSelector((state) => state.amcat);
  const amcatIndices = useSelector((state) => state.amcatIndices);
  const amcatIndex = useSelector((state) => state.amcatIndex);
  const dispatch = useDispatch();

  const [selectedAmcatIndex, setSelectedAmcatIndex] = useState(amcatIndex);

  useEffect(() => {
    if (amcat && amcatIndices.length === 0)
      amcat.getIndices().then((res) => {
        dispatch(setAmcatIndices(res.data));
      });
  }, []);

  useEffect(() => {
    dispatch(selectAmcatIndex(selectedAmcatIndex));
  }, [selectedAmcatIndex, dispatch]);

  if (type === "table") {
    const tableColumns = [
      {
        Header: "Select Index",
        accessor: "name",
        headerClass: "thirteen wide",
      },
    ];

    return (
      <Container selectAmcatIndex>
        <Button.Group widths="2">
          <CreateAmcatIndex />
          <DeleteAmcatIndex />
        </Button.Group>
        <SelectionTable
          columns={tableColumns}
          data={amcatIndices}
          selectedAmcatIndex={selectedAmcatIndex}
          setSelectedRow={setSelectedAmcatIndex}
          defaultSize={15}
        />
      </Container>
    );
  }

  return null;
};

export default AmcatIndexSelector;

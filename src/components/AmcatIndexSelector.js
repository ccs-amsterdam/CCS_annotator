import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Container, Dropdown } from "semantic-ui-react";
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
    dispatch(selectAmcatIndex(selectedAmcatIndex));
  }, [selectedAmcatIndex, dispatch]);

  useEffect(() => {
    if (amcat && amcatIndices === null) {
      amcat.getIndices().then((res) => {
        dispatch(setAmcatIndices(res.data));
      });
    }
  }, [amcat, amcatIndices, dispatch]);

  if (type === "table") {
    const tableColumns = [
      {
        Header: "Select Index",
        accessor: "name",
        headerClass: "thirteen wide",
      },
    ];

    return (
      <Container>
        <Button.Group widths="2">
          <CreateAmcatIndex />
          <DeleteAmcatIndex />
        </Button.Group>
        <SelectionTable
          columns={tableColumns}
          data={amcatIndices ? amcatIndices : []}
          selectedRow={selectedAmcatIndex}
          setSelectedRow={setSelectedAmcatIndex}
          defaultSize={15}
        />
      </Container>
    );
  }

  if (type === "dropdown") {
    const asDropdownItems = (indices) => {
      return indices.map((index) => {
        return { key: index.name, text: index.name, value: index.name };
      });
    };

    const onDropdownSelect = (value) => {
      if (value && amcatIndices !== null) {
        const i = amcatIndices.findIndex((row) => row.name === value);
        setSelectedAmcatIndex({ ...amcatIndices[i], ROW_ID: i.toString() });
      } else {
        setSelectedAmcatIndex(null);
      }
    };

    return (
      <Dropdown
        clearable
        selection
        options={asDropdownItems(amcatIndices)}
        value={amcatIndex ? amcatIndex.name : null}
        onChange={(e, d) => onDropdownSelect(d.value)}
      />
    );
  }

  return null;
};

export default AmcatIndexSelector;

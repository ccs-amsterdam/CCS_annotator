import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Segment, Dropdown, Container } from "semantic-ui-react";
import { selectCodingjob, setCodingjobs, setDocuments } from "../actions";

import SelectionTable from "./SelectionTable";
import CreateCodingjob from "./CreateCodingjob";
import DeleteCodingjob from "./DeleteCodingjob";

const CodingjobSelector = ({ type = "table" }) => {
  const db = useSelector((state) => state.db);
  const codingjobs = useSelector((state) => state.codingjobs);
  const codingjob = useSelector((state) => state.codingjob);
  const dispatch = useDispatch();

  const [selectedCodingjob, setSelectedCodingjob] = useState(codingjob);

  useEffect(() => {
    dispatch(selectCodingjob(selectedCodingjob));
  }, [codingjob, selectedCodingjob, dispatch]);

  useEffect(() => {
    if (db && codingjob) {
      db.listDocuments(codingjob)
        .then((documents) => {
          dispatch(setDocuments(documents));
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }, [db, codingjob, dispatch]);

  useEffect(() => {
    if (db && codingjobs === null) {
      db.listCodingjobs().then((cjs) => {
        // add timestamp and sort cjs by timestamp to show most recent
        dispatch(setCodingjobs(cjs));
        if (cjs.length > 0) setSelectedCodingjob({ ...cjs[0], ROW_ID: "0" });
      });
    }
  }, [db, codingjobs, dispatch]);

  //if (!codingjob) return null;

  if (type === "table") {
    const tableColumns = [
      {
        Header: "Select Index",
        accessor: "name",
        headerClass: "thirteen wide",
      },
    ];

    return (
      <Segment style={{ border: "0" }}>
        <Button.Group widths="2">
          <CreateCodingjob />
          <DeleteCodingjob />
        </Button.Group>

        <Container style={{ marginTop: "30px" }}>
          <SelectionTable
            columns={tableColumns}
            data={codingjobs ? codingjobs : []}
            selectedRow={selectedCodingjob}
            setSelectedRow={setSelectedCodingjob}
            defaultSize={15}
          />
        </Container>
      </Segment>
    );
  }

  if (type === "dropdown") {
    const asDropdownItems = (indices) => {
      return indices.map((index) => {
        return { key: index.name, text: index.name, value: index.name };
      });
    };

    const onDropdownSelect = (value) => {
      if (value && codingjobs !== null) {
        const i = codingjobs.findIndex((row) => row.name === value);
        setSelectedCodingjob({ ...codingjobs[i], ROW_ID: i.toString() });
      } else {
        setSelectedCodingjob(null);
      }
    };

    return (
      <Dropdown
        clearable
        selection
        options={asDropdownItems(codingjobs)}
        value={codingjob ? codingjob.name : null}
        onChange={(e, d) => onDropdownSelect(d.value)}
      />
    );
  }

  return null;
};

export default CodingjobSelector;

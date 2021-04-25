import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Segment, Dropdown, Container } from "semantic-ui-react";
import { selectCodingjob, setCodingjobs, setDocuments } from "../actions";
import Dexie from "dexie";

import SelectionTable from "./SelectionTable";
import CreateCodingjob from "./CreateCodingjob";
import DeleteCodingjob from "./DeleteCodingjob";
import AnnotationDB from "../apis/dexie";

const CodingjobSelector = ({ type = "table" }) => {
  const codingjobs = useSelector((state) => state.codingjobs);
  const codingjob = useSelector((state) => state.codingjob);
  const dispatch = useDispatch();

  const [selectedCodingjob, setSelectedCodingjob] = useState(codingjob);

  useEffect(() => {
    dispatch(selectCodingjob(selectedCodingjob));
  }, [selectedCodingjob, dispatch]);

  useEffect(() => {
    if (codingjob) {
      getJobArticles(codingjob, dispatch);
    } else {
      setSelectedCodingjob(null);
      dispatch(setDocuments([]));
    }
  }, [codingjob, dispatch]);

  useEffect(() => {
    if (codingjobs.length === 0) {
      getCodingjobs(dispatch, setSelectedCodingjob);
    }
  }, [codingjobs, dispatch]);

  if (type === "table") {
    const tableColumns = [
      {
        Header: "Coding job",
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

        <Container
          style={{ marginTop: "30px", overflow: "auto", width: "800px" }}
        >
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
        return { key: index.job_id, text: index.name, value: index.name };
      });
    };

    const onDropdownSelect = (value) => {
      if (value && codingjobs.length > 0) {
        const i = codingjobs.findIndex((row) => row.name === value);
        setSelectedCodingjob({ ...codingjobs[i], ROW_ID: i.toString() });
      } else {
        setSelectedCodingjob(null);
      }
      console.log(selectedCodingjob);
    };

    return (
      <Dropdown
        inline
        search
        options={asDropdownItems(codingjobs)}
        value={codingjob ? codingjob.name : null}
        onChange={(e, d) => onDropdownSelect(d.value)}
      />
    );
  }

  return null;
};

const getCodingjobs = async (dispatch, setSelectedCodingjob) => {
  // the exists check is super annoying, but if db is included in useEffect, it somehow
  // rerenders non-stop, and if this check is not here then a new DB will be created immediately
  // when reset is called.
  const exists = await Dexie.exists("AmCAT_Annotator");
  if (!exists) return null;
  try {
    const db = new AnnotationDB();
    const cjs = await db.listCodingjobs();
    dispatch(setCodingjobs(cjs));
    if (cjs.length > 0) setSelectedCodingjob({ ...cjs[0], ROW_ID: "0" });
  } catch (e) {
    console.log(e);
  }
};

const getJobArticles = async (codingjob, dispatch) => {
  const exists = await Dexie.exists("AmCAT_Annotator");
  if (!exists) return null;
  try {
    const db = new AnnotationDB();
    const documents = await db.listDocuments(codingjob);
    dispatch(setDocuments(documents));
  } catch (e) {
    console.log(e);
  }
};

export default CodingjobSelector;

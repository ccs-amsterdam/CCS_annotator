import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbSection,
  ButtonGroup,
  Button,
  Grid,
  Input,
  Pagination,
} from "semantic-ui-react";

import axios from "axios";
import hash from "object-hash";

import CodingjobSelector from "./CodingjobSelector";
import AnnotationForm from "./AnnotationForm";
import db from "../apis/dexie";
import { selectCodingjob, setCodingjobs } from "../actions";

const Annotate = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const codeMap = useSelector((state) => state.codeMap);
  const dispatch = useDispatch();

  const location = useLocation();

  const [doc, setDoc] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [delayedActivePage, setDelayedActivePage] = useState(1);
  const [ready, setReady] = useState(false);
  const [modes, setModes] = useState(["Edit", "Code"]); // make this a setting in codebook
  const [selectedMode, setSelectedMode] = useState("Edit");
  const [jobDetails, setJobDetails] = useState({});

  useEffect(() => {
    if (location.search) {
      const jobURL = location.search.substring(1);
      openExternalJob(jobURL, dispatch, setReady);
    } else {
      setReady(true);
    }
  }, [location, dispatch]);

  useEffect(() => {
    if (!codingjob) return null;
    if (!ready) return null;
    setActivePage(1);
    setupCodingjob(codingjob, setDoc, setJobDetails);
  }, [codingjob, ready, setDoc, setSelectedMode]);

  useEffect(() => {
    if (!ready) return null;
    documentSelector(codingjob, activePage - 1, setDoc, hash(codeMap));
    setDelayedActivePage(activePage);
  }, [codingjob, activePage, selectedMode, codeMap, ready]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActivePage(delayedActivePage);
    }, 500);
    return () => clearTimeout(timer);
  }, [codingjob, delayedActivePage]);

  return (
    <Grid container columns={2}>
      <Grid.Row>
        <Grid.Column width={4}>
          <Breadcrumb>
            <BreadcrumbSection link style={{ minWidth: "5em" }}>
              <CodingjobSelector type="dropdown" />
            </BreadcrumbSection>
            <Breadcrumb.Divider />
            <BreadcrumbSection>{doc?.document_id ? doc.document_id : activePage}</BreadcrumbSection>
          </Breadcrumb>
        </Grid.Column>
        <Grid.Column align="center" floated="right" width={4}>
          <ButtonGroup compact basic>
            {modes.length > 1
              ? modes.map((mode) => (
                  <Button active={mode === selectedMode} onClick={(e, d) => setSelectedMode(mode)}>
                    {mode}
                  </Button>
                ))
              : null}
          </ButtonGroup>
        </Grid.Column>
        <Grid.Column align="center" floated="right" width={4}>
          {selectedMode === "Edit"
            ? documentPagination(
                activePage,
                delayedActivePage,
                jobDetails,
                setActivePage,
                setDelayedActivePage,
                selectedMode
              )
            : null}
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <AnnotationForm doc={doc ? doc : null} codingjob={codingjob} mode={selectedMode} />
      </Grid.Row>
    </Grid>
  );
};

const documentPagination = (
  activePage,
  delayedActivePage,
  jobDetails,
  setActivePage,
  setDelayedActivePage
) => {
  return (
    <>
      <Grid.Row>
        <Input
          min={1}
          max={jobDetails.nDocs}
          onChange={(e, d) => setDelayedActivePage(d.value)}
          type="range"
          value={delayedActivePage}
        />
      </Grid.Row>
      <Grid.Row>
        <Pagination
          activePage={delayedActivePage}
          size={"mini"}
          firstItem={null}
          lastItem={null}
          siblingRange={0}
          boundaryRange={0}
          ellipsisItem={null}
          totalPages={jobDetails.nDocs}
          onPageChange={(e, d) => setActivePage(d.activePage)}
        />
      </Grid.Row>
    </>
  );
};

const setupCodingjob = async (codingjob, setDoc, setJobDetails) => {
  const n = await db.getJobDocumentCount(codingjob);

  setJobDetails({ nDocs: n });
  if (n > 0) {
    documentSelector(codingjob, 0, setDoc, "");
  } else {
    setDoc(null);
  }

  let annotations = await db.getJobAnnotations(codingjob);
  annotations = annotations.reduce((array, annotation, docIndex) => {
    for (let i of Object.keys(annotation)) {
      for (let group of Object.keys(annotation[i])) {
        array.push({ docIndex, group, index: i, ...annotation[i][group] });
      }
    }
    return array;
  }, []);
  console.log(annotations);
  //console.log(ann);
};

const documentSelector = async (codingjob, i, setDoc, codeMapHash) => {
  if (!codingjob) return null;
  let doc = await db.getJobDocuments(codingjob, i, 1);
  doc[0].codeMapHash = codeMapHash;
  doc[0].writable = false;
  if (doc) setDoc(doc[0]);
};

const openExternalJob = async (jobURL, dispatch, setReady) => {
  const response = await axios.get(jobURL);
  const data = response.data;
  let job = { name: data.details.name, job_id: hash(data) };
  job = await db.getCodingjob(job);
  if (!job) {
    await db.createCodingjob(data.details.name, hash(data));
    await db.createDocuments(job, data.documents, true);
    await db.writeCodebook(job, data.codebook);
  }
  const codingjobs = await db.listCodingjobs();
  const cj = await db.getCodingjob(job);
  dispatch(selectCodingjob(cj));
  dispatch(setCodingjobs(codingjobs));
  setReady(true);
};

export default Annotate;

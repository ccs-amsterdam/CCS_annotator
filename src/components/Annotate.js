import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
//import { useLocation } from "react-router-dom";
import { Breadcrumb, BreadcrumbSection, Grid, Input, Pagination } from "semantic-ui-react";

import axios from "axios";
import hash from "object-hash";

import CodingjobSelector from "./CodingjobSelector";
import AnnotationText from "./AnnotationText";
import db from "../apis/dexie";
import { selectCodingjob, setCodingjobs } from "../actions";

const Annotate = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const dispatch = useDispatch();

  //const location = useLocation();
  // if location is given, it should point to a codingjob
  // get the hash of the job and check if its in the indexeddb
  // if not add, with a field saying that user is not the creator
  // user will then only see annotation screen (no codingjob item in menubar)
  // instead show 'time since saved' if there is a db connection
  // and/or an 'export' button
  // (maybe start with just saving to amcat on every change to annotations)

  const jobURL =
    "https://raw.githubusercontent.com/ccs-amsterdam/amcat4annotator/main/demo_data/codingjob.json";

  const [doc, setDoc] = useState(null);
  const [nDocuments, setNDocuments] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [delayedActivePage, setDelayedActivePage] = useState(1);

  useEffect(() => {
    if (jobURL) openExternalJob(jobURL, dispatch);
  }, [jobURL, dispatch]);

  useEffect(() => {
    if (!codingjob) return null;
    setActivePage(1);
    setupCodingjob(codingjob, setDoc, setNDocuments);
  }, [codingjob]);

  useEffect(() => {
    documentSelector(codingjob, activePage - 1, setDoc);
    setDelayedActivePage(activePage);
  }, [codingjob, activePage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActivePage(delayedActivePage);
    }, 500);
    return () => clearTimeout(timer);
  }, [codingjob, delayedActivePage]);

  return (
    <Grid container columns={2}>
      <Grid.Row>
        <Grid.Column width={10}>
          <Breadcrumb>
            <BreadcrumbSection link style={{ minWidth: "5em" }}>
              <CodingjobSelector type="dropdown" />
            </BreadcrumbSection>
            <Breadcrumb.Divider />
            <BreadcrumbSection>{doc ? doc.title : null}</BreadcrumbSection>
          </Breadcrumb>
        </Grid.Column>
        <Grid.Column align="center" floated="right" width={4}>
          {documentPagination(
            activePage,
            delayedActivePage,
            nDocuments,
            setActivePage,
            setDelayedActivePage
          )}
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <AnnotationText doc={doc ? doc : null} />
      </Grid.Row>
    </Grid>
  );
};

const documentPagination = (
  activePage,
  delayedActivePage,
  nDocuments,
  setActivePage,
  setDelayedActivePage
) => {
  return (
    <>
      <Grid.Row>
        <Input
          min={1}
          max={nDocuments}
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
          totalPages={nDocuments}
          onPageChange={(e, d) => setActivePage(d.activePage)}
        />
      </Grid.Row>
    </>
  );
};

const setupCodingjob = async (codingjob, setDoc, setNDocuments) => {
  const n = await db.getJobDocumentCount(codingjob);
  setNDocuments(n);
  if (n > 0) {
    documentSelector(codingjob, 0, setDoc);
  } else {
    setDoc(null);
  }
};

const documentSelector = async (codingjob, i, setDoc) => {
  if (!codingjob) return null;
  let doc = await db.getJobDocumentsBatch(codingjob, i, 1);
  if (doc) setDoc(doc[0]);
};

const openExternalJob = async (jobURL, dispatch) => {
  const response = await axios.get(jobURL);
  const data = response.data;
  console.log(data);
  const job = { name: data.details.name, job_id: hash(data) };
  let hasjob = await db.getCodingjob(job);
  if (!hasjob) {
    await db.createCodingjob(data.details.name, hash(data));
    await db.createDocuments(job, data.documents, true);
    await db.writeCodebook(job, data.codebook);
  }
  const codingjobs = await db.listCodingjobs();
  const cj = await db.getCodingjob(job);
  dispatch(selectCodingjob(cj));
  dispatch(setCodingjobs(codingjobs));
};

export default Annotate;

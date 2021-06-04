import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Breadcrumb, BreadcrumbSection, Grid, Input, Pagination } from "semantic-ui-react";

import axios from "axios";
import hash from "object-hash";

import CodingjobSelector from "./CodingjobSelector";
import AnnotationText from "./AnnotationText";
import db from "../apis/dexie";
import { selectCodingjob, setCodingjobs } from "../actions";

const Annotate = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const codeMap = useSelector((state) => state.codeMap);
  const dispatch = useDispatch();

  const location = useLocation();

  const [doc, setDoc] = useState(null);
  const [nDocuments, setNDocuments] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [delayedActivePage, setDelayedActivePage] = useState(1);
  const [ready, setReady] = useState(false);

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
    setupCodingjob(codingjob, setDoc, setNDocuments, dispatch);
  }, [codingjob, ready, dispatch]);

  useEffect(() => {
    if (!ready) return null;
    documentSelector(codingjob, activePage - 1, setDoc, hash(codeMap), dispatch);
    setDelayedActivePage(activePage);
  }, [codingjob, activePage, codeMap, ready, dispatch]);

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
            <BreadcrumbSection>{doc?.document_id ? doc.document_id : activePage}</BreadcrumbSection>
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

const setupCodingjob = async (codingjob, setDoc, setNDocuments, dispatch) => {
  const n = await db.getJobDocumentCount(codingjob);
  setNDocuments(n);
  if (n > 0) {
    documentSelector(codingjob, 0, setDoc, "", dispatch);
  } else {
    setDoc(null);
  }
};

const documentSelector = async (codingjob, i, setDoc, codeMapHash, dispatch) => {
  if (!codingjob) return null;
  let doc = await db.getJobDocumentsBatch(codingjob, i, 1);
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

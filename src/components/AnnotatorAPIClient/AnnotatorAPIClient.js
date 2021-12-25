import React, { useState, useEffect } from "react";
import Annotator from "components/Annotator/Annotator";
import { Grid } from "semantic-ui-react";
import useBackend from "./useBackend";
import JobServerAPI from "./lib/JobServerAPI";

//   http://localhost:3000/CCS_annotator#/annotator?url=http://localhost:5000/codingjob/25

const AnnotatorAPIClient = () => {
  const [host, jobId] = parseUrl(window.location.href);
  const [backend, loginForm] = useBackend(host);
  const jobServer = useJobServerBackend(backend, jobId);
  console.log(backend);
  if (!backend)
    // If backend isn't connected, show login screen
    // If the url contained a host, this field is fixed
    return (
      <Grid inverted textAlign="center" style={{ height: "100vh" }} verticalAlign="middle">
        <Grid.Column style={{ maxWidth: 450 }}>{loginForm}</Grid.Column>
      </Grid>
    );

  if (!jobServer) {
    // if backend is connected, but there is no jobServer (because no job_id was passed in the url)
    // show a screen with some relevant info for the user on this host. Like current / new jobs
    return null;
  }

  return <Annotator jobServer={jobServer} />;
};

const useJobServerBackend = (backend, jobId) => {
  const [jobServer, setJobServer] = useState(null);

  useEffect(() => {
    if (!backend || !jobId) {
      setJobServer(null);
      return;
    }
    const js = new JobServerAPI(backend, jobId);
    js.init().then(() => setJobServer(js)); // add a check for if job_id is invalid
  }, [backend, jobId]);

  return jobServer;
};

/**
 * look for the query parameter url  (?url = ...)
  /if it exists, return the origin/host and the last part of the path (which should be the job_id)
 * @param {*} href from window.location.href
 * @returns 
 */
const parseUrl = (href) => {
  console.log(href);
  console.log("print");
  const params = href.split("?")?.[1];
  if (!params) return [null, null];

  const parts = params.split("&");
  const queries = parts.reduce((obj, part) => {
    const [key, value] = part.split("=");
    obj[decodeURIComponent(key)] = decodeURIComponent(value);
    return obj;
  }, {});
  if (!queries.url) return [null, null];

  const url = new URL(queries.url);
  return [url.origin, url.pathname.split("/").slice(-1)[0]];
};

export default AnnotatorAPIClient;

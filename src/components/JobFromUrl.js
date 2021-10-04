import React, { useEffect } from "react";

import axios from "axios";
import hash from "object-hash";

import db from "apis/dexie";
import { selectCodingjob, setCodingjobs } from "actions";

const JobFromUrl = () => {
  // probably turn into a hook or something
  // in any case, should be plugged in home to watch for urls that refer to a job

  useEffect(() => {
    if (location.search) {
      const jobURL = location.search.substring(1);
      openExternalJob(jobURL, dispatch);
    }
  }, [location, dispatch]);

  return <div></div>;
};

const openExternalJob = async (jobURL, dispatch) => {
  const response = await axios.get(jobURL);
  const data = response.data;
  let job = { name: data.details.name, job_id: hash(data) };
  job = await db.idb.codingjobs.get(job.job_id);
  if (!job) {
    await db.createCodingjob(data.details.name, hash(data));
    await db.createDocuments(job, data.documents, true);
    await db.writeCodebook(job, data.codebook);
  }
  const codingjobs = await db.listCodingjobs();
  const cj = await db.idb.codingjobs.get(job.job_id);
  dispatch(selectCodingjob(cj));
  dispatch(setCodingjobs(codingjobs));
};

export default JobFromUrl;

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

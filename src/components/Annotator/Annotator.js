import React, { useState, useEffect } from "react";
import { useLocation } from "react-router";

import db from "apis/dexie";
import AnnotatorScreen from "components/Annotator/AnnotatorScreen";
import { JobServerRemote, JobServerLocal } from "components/Annotator/JobServerClass";

const Annotator = () => {
  const location = useLocation();
  const [jobServer, setJobServer] = useState(null);

  useEffect(() => {
    if (location.search) {
      const queries = parseQueryString(location);
      if (queries?.url) createRemoteJobServer(queries.url, setJobServer);
      if (queries?.id) createLocalJobServer(queries.id, setJobServer);
    } else {
      setJobServer(null);
    }
  }, [location, setJobServer]);

  //if (!JobServer) return <TaskSelector />;
  if (!jobServer) return null;
  return <AnnotatorScreen jobServer={jobServer} />;
};

const createLocalJobServer = async (id, setJobServer) => {
  const user = await db.idb.user.get(1);
  const us = new JobServerLocal(id, user.name);
  await us.init();
  setJobServer(us);
};

const createRemoteJobServer = async (url, setJobServer) => {
  const user = await db.idb.user.get(1);
  const us = new JobServerRemote(url, user.name);
  await us.init();
  setJobServer(us);
};

const parseQueryString = (location) => {
  const query = location.search.substring(1);
  const parts = query.split("&");
  return parts.reduce((obj, part) => {
    const [key, value] = part.split("=");
    obj[decodeURIComponent(key)] = decodeURIComponent(value);
    return obj;
  }, {});
};

export default Annotator;

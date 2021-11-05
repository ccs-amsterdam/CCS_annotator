import React, { useState, useEffect } from "react";
import { useLocation } from "react-router";

import AnnotatorScreen from "components/Annotator/AnnotatorScreen";
import { JobServerRemote, JobServerLocal } from "components/Annotator/JobServerClass";
import { useCookies } from "react-cookie";

const Annotator = () => {
  const location = useLocation();
  const [jobServer, setJobServer] = useState(null);
  const [cookies] = useCookies(["name"]);

  useEffect(() => {
    console.log(location);
    if (location.search) {
      const queries = parseQueryString(location);
      if (queries?.url) createRemoteJobServer(queries.url, cookies, setJobServer);
      if (queries?.id) createLocalJobServer(queries.id, cookies, setJobServer);
    } else {
      setJobServer(null);
    }
  }, [location, cookies, setJobServer]);

  //if (!JobServer) return <TaskSelector />;
  if (!jobServer) return null;
  return <AnnotatorScreen jobServer={jobServer} />;
};

const createLocalJobServer = async (id, cookies, setJobServer) => {
  const us = new JobServerLocal(id, cookies.name);
  await us.init();
  setJobServer(us);
};

const createRemoteJobServer = async (url, cookies, setJobServer) => {
  const us = new JobServerRemote(url, cookies.name);
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

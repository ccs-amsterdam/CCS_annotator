import React, { useState, useEffect } from "react";
import { useLocation } from "react-router";

import Annotator from "react-ccs-annotator";
import { JobServerRemote, JobServerLocal } from "components/Annotator/JobServerClass";
import { useCookies } from "react-cookie";
import Login from "components/HeaderMenu/Login";

import "components/Annotator/annotatorStyle.css";
import newAmcatSession from "apis/amcat";

const AnnotatorLocal = () => {
  const location = useLocation();
  const [jobServer, setJobServer] = useState(null);
  const [loginScreen, setLoginScreen] = useState(null);
  const [cookies] = useCookies(["amcat"]);

  useEffect(() => {
    if (location.search) {
      const queries = parseQueryString(location);
      if (queries?.url) createRemoteJobServer(queries.url, cookies, setJobServer, setLoginScreen);
      if (queries.id) createLocalJobServer(queries.id, cookies, setJobServer, setLoginScreen);
    } else {
      setJobServer(null);
    }
  }, [location, cookies, setJobServer]);

  if (!jobServer) return loginScreen;
  return <Annotator jobServer={jobServer} />;
};

const createRemoteJobServer = async (url, cookies, setJobServer, setLoginScreen) => {
  const u = new URL(url);
  const amcat = newAmcatSession(u.origin, cookies?.amcat?.token);

  try {
    await amcat.getToken();
  } catch (e) {
    // if could not get token, assume it's because login failed
    setLoginScreen(<Login host={u.origin} force={true} />);
  }

  const job_id = u.pathname.split("/").slice(-1)[0];
  const us = new JobServerRemote(amcat, job_id);
  await us.init();
  if (us.success) setJobServer(us);
};

const createLocalJobServer = async (id, cookies, setJobServer) => {
  const us = new JobServerLocal(id, cookies?.email, cookies?.token);
  await us.init();
  if (us.success) setJobServer(us);
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

export default AnnotatorLocal;

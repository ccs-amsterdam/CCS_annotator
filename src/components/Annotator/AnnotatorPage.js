import React, { useState, useEffect } from "react";
import { useLocation } from "react-router";

import Annotator from "./Annotator";
import db from "apis/dexie";
import { UnitServerRemote, UnitServerLocal } from "./UnitServerClass";

const AnnotatorPage = () => {
  const location = useLocation();
  const [UnitServer, setUnitServer] = useState(null);

  useEffect(() => {
    if (location.search) {
      const queries = parseQueryString(location);
      if (!queries?.url) return;
      console.log(queries);
      createUnitServer(queries.url, setUnitServer);
    }
  }, [location, setUnitServer]);

  if (!UnitServer) return null;
  return <Annotator UnitServer={UnitServer} />;
};

const createUnitServer = async (url, setUnitServer) => {
  const user = await db.idb.user.get(1);

  let us;
  if (url.substring(0, 4) === "http") {
    us = new UnitServerRemote(url, user);
  } else us = new UnitServerLocal(url, user);

  await us.init();
  setUnitServer(us);
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

export default AnnotatorPage;

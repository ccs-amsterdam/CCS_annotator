import React from "react";
import { Route, Redirect } from "react-router";
import { useDispatch } from "react-redux";
import { setDB } from "../actions";
import Dexie from "dexie";

import AnnotationDB from "../apis/dexie";

const AuthRoute = ({ Component, homepage, ...componentProps }) => {
  const dispatch = useDispatch();
  // the trick for passing on componentProps is basically
  // redundant now that we use Redux, but leaving it intact just in case

  const loggin = async () => {
    const db = await new AnnotationDB();
    dispatch(setDB(db));
  };

  Dexie.exists("AmCAT_Annotator").then((exists) => {
    loggin();
    if (!exists) return <Redirect to={homepage} />;
  });

  return (
    <Route
      {...componentProps}
      render={(props) => <Component {...componentProps} {...props} />}
    />
  );
};

export default AuthRoute;

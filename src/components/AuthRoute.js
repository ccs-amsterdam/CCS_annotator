import React, { useState } from "react";
import { Route, Redirect } from "react-router";
import { useDispatch } from "react-redux";
import { setDB } from "../actions";
import Dexie from "dexie";

import AnnotationDB from "../apis/dexie";

const AuthRoute = ({ Component, homepage, ...componentProps }) => {
  const [loading, setLoading] = useState(true);
  const [hasdb, setHasdb] = useState(false);
  const dispatch = useDispatch();
  // the trick for passing on componentProps is basically
  // redundant now that we use Redux, but leaving it intact just in case

  const connect = async () => {
    const exists = await Dexie.exists("AmCAT_Annotator");
    if (exists) {
      const db = await new AnnotationDB();
      dispatch(setDB(db));
      setHasdb(true);
    } else {
      setHasdb(false);
    }
    setLoading(false);
  };

  connect();

  return (
    <Route
      {...componentProps}
      render={(props) =>
        loading ? (
          <div>loading...</div>
        ) : hasdb ? (
          <Component {...componentProps} {...props} />
        ) : (
          <Redirect to={homepage} />
        )
      }
    />
  );
};

export default AuthRoute;

import React, { useState } from "react";
import { Route } from "react-router";
import Welcome from "./Welcome";
import db from "apis/dexie";

const AuthRoute = ({ Component, homepage, ...componentProps }) => {
  const [loading, setLoading] = useState(true);
  const [hasdb, setHasdb] = useState(false);
  // the trick for passing on componentProps is basically
  // redundant now that we use Redux, but leaving it intact just in case

  const connect = async () => {
    if (await db.newUser()) {
      setHasdb(false);
    } else {
      setHasdb(true);
    }
    setLoading(false);
  };
  connect();

  const url = componentProps.location.pathname + componentProps.location.search;
  if (!loading && !hasdb) return <Welcome redirectUrl={url} />;

  return (
    <Route
      {...componentProps}
      render={(props) =>
        loading ? (
          <div>loading...</div>
        ) : hasdb ? (
          <Component {...componentProps} {...props} />
        ) : null
      }
    />
  );
};

export default AuthRoute;

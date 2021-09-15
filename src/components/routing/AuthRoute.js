import React, { useState } from "react";
import { Route, Redirect } from "react-router";
import db from "apis/dexie";

const AuthRoute = ({ Component, homepage, ...componentProps }) => {
  const [loading, setLoading] = useState(true);
  const [hasdb, setHasdb] = useState(false);
  // the trick for passing on componentProps is basically
  // redundant now that we use Redux, but leaving it intact just in case

  const connect = async () => {
    if (await db.isWelcome()) {
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

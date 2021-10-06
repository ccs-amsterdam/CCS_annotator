import React, { useState } from "react";
import { Route, useHistory } from "react-router";
import db from "apis/dexie";

const AuthRoute = ({ Component, homepage, ...componentProps }) => {
  const [loading, setLoading] = useState(true);
  const [hasdb, setHasdb] = useState(false);
  const history = useHistory();
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

  console.log("test");
  if (!loading && !hasdb) history.push("/");

  return (
    <Route
      {...componentProps}
      render={props =>
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

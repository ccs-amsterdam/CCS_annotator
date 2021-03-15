import React from "react";
import { useSelector } from "react-redux";
import { Route, Redirect } from "react-router";

const AuthRoute = ({ Component, ...componentProps }) => {
  // the trick for passing on componentProps is basically
  // redundant now that we use Redux, but leaving it intact just in case
  const session = useSelector((state) => state.session);
  if (!session) return <Redirect to="/" />;
  return (
    <Route
      {...componentProps}
      render={(props) => <Component {...componentProps} {...props} />}
    />
  );
};

export default AuthRoute;

import React from "react";
import { useSelector } from "react-redux";

const Annotate = () => {
  const session = useSelector((state) => state.session);
  console.log(session);
  return <div>Annotate!!!</div>;
};

export default Annotate;

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Header, Menu, Sidebar } from "semantic-ui-react";
import { setShowSidebar } from "../actions";

const CodebookSidebar = () => {
  const showSidebar = useSelector((state) => state.showSidebar);
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(setShowSidebar(false));
    };
  }, []);

  console.log(showSidebar);
  return (
    <Menu.Item
      name={`${showSidebar ? "Hide" : "Show"} codebook`}
      onClick={() => dispatch(setShowSidebar(!showSidebar))}
    />
  );
};

export default CodebookSidebar;

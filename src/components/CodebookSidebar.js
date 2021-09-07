import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Menu } from "semantic-ui-react";
import { setShowSidebar, blockEvents } from "../actions";

const CodebookSidebar = () => {
  const showSidebar = useSelector(state => state.showSidebar);
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(setShowSidebar(false));
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(blockEvents(showSidebar));
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch, showSidebar]);

  return (
    <Menu.Item
      name={`${showSidebar ? "Hide" : "Show"} codebook`}
      onClick={() => dispatch(setShowSidebar(!showSidebar))}
    />
  );
};

export default CodebookSidebar;

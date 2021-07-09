import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Menu } from "semantic-ui-react";
import { setMode } from "../actions";

const PreviewMode = () => {
  const mode = useSelector((state) => state.mode);
  const dispatch = useDispatch();

  const togglePreview = () => {
    if (mode === "preview") dispatch(setMode("design"));
    if (mode === "design") dispatch(setMode("preview"));
  };

  console.log(mode);
  if (mode === "annotate") return null;
  return (
    <Menu.Item
      icon={mode === "preview" ? "eye slash" : "eye"}
      style={{ color: "lightgreen" }}
      name={"Preview"}
      onClick={togglePreview}
    />
  );
};

export default PreviewMode;
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Dropdown } from "semantic-ui-react";
import { setCodes, setCode } from "../Actions";
import randomColor from "randomcolor";

const CodeSelector = () => {
  const codes = useSelector((state) => state.codes);
  const code = useSelector((state) => state.code);
  const dispatch = useDispatch();

  const onAddition = (e, d) => {
    dispatch(
      setCodes([
        {
          key: d.value,
          text: d.value,
          value: d.value,
          color: randomColor({ seed: d.value, luminosity: "bright" }),
        },
        ...codes,
      ])
    );
  };

  const renderLabel = (option) => ({
    color: option.color,
    content: option.text,
  });

  return (
    <Dropdown
      options={codes}
      placeholder="Choose Language"
      search
      selection
      fluid
      allowAdditions
      value={code}
      onAddItem={onAddition}
      on="keydown"
      onChange={(e, d) => dispatch(setCode(d.value))}
      renderLabel={renderLabel}
    />
  );
};

export default CodeSelector;

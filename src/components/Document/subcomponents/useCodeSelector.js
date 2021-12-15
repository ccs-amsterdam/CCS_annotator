import React, { useState, useEffect, useRef } from "react";
import { Dropdown, Popup, Ref } from "semantic-ui-react";
import { toggleSpanAnnotation } from "library/annotations";
import { codeBookEdgesToMap } from "library/codebook";
import { getColor, getColorGradient } from "library/tokenDesign";
import ButtonSelection from "./ButtonSelection";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const useCodeSelector = (
  tokens,
  variables,
  selectedVariable,
  annotations,
  setAnnotations,
  codeHistory,
  setCodeHistory,
  fullScreenNode,
  editMode
) => {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState(null);
  const [existing, setExisting] = useState([]);
  const [variable, setVariable] = useState(null);
  const [tokenRef, setTokenRef] = useState(null);
  const [tokenAnnotations, setTokenAnnotations] = useState({});

  const [fullVariableMap, setFullVariableMap] = useState(null);
  const [variableMap, setVariableMap] = useState(null);

  useEffect(() => {
    // creates fullVariableMap
    if (!variables || variables.length === 0) {
      setFullVariableMap(null);
      return null;
    }

    const vm = {};
    for (let variable of variables) {
      let cm = codeBookEdgesToMap(variable.codes);
      cm = Object.keys(cm).reduce((obj, key) => {
        if (!cm[key].active || !cm[key].activeParent) return obj;
        obj[key] = cm[key];
        return obj;
      }, {});
      vm[variable.name] = { ...variable, codeMap: cm };
    }

    setFullVariableMap(vm);
  }, [variables, setFullVariableMap]);

  useEffect(() => {
    // creates the actually used variableMap from the fullVariableMap
    // this lets us select specific variables without recreating full map
    if (fullVariableMap === null) {
      setVariableMap(null);
      return;
    }
    setVariable(null);
    if (selectedVariable === null || selectedVariable === "EDIT ALL") {
      setVariableMap(fullVariableMap);
    } else {
      setVariableMap({ [selectedVariable]: fullVariableMap[selectedVariable] });
    }
  }, [fullVariableMap, selectedVariable, setVariable, setVariableMap]);

  const triggerFunction = (index, selection) => {
    if (!tokens[index].ref) return;
    setTokenRef(tokens[index].ref);
    setTokenAnnotations(annotations[index] || {});
    setSelection(selection || { index }); // if selection is empty, pass index, and get selection in selectVariablePage
    setOpen(true);
  };

  useEffect(() => {
    setOpen(false);
  }, [tokens]);

  useEffect(() => {
    if (!open) setVariable(null);
  }, [open]);

  if (!variables) return [null, null, null, true];

  let popupPage1;
  if (editMode) {
    popupPage1 = (
      <SelectAnnotationPage
        tokens={tokens}
        variable={variable}
        setVariable={setVariable}
        setExisting={setExisting}
        variableMap={variableMap}
        annotations={annotations}
        selection={selection}
        setSelection={setSelection}
        setOpen={setOpen}
      />
    );
  } else {
    popupPage1 = (
      <SelectVariablePage
        variable={variable}
        setVariable={setVariable}
        setExisting={setExisting}
        variableMap={variableMap}
        annotations={annotations}
        selection={selection}
        setOpen={setOpen}
      />
    );
  }

  let popupPage2 = (
    <NewCodePage // if current is known, select what the new code should be (or delete, or ignore)
      tokens={tokens}
      variable={variable}
      variableMap={variableMap}
      existing={existing}
      settings={variableMap?.[variable]}
      codeHistory={codeHistory[variable] || []}
      annotations={tokenAnnotations}
      setAnnotations={setAnnotations}
      selection={selection}
      setOpen={setOpen}
      setCodeHistory={setCodeHistory}
    />
  );

  let popup = (
    <CodeSelectorPopup
      variable={variable}
      fullScreenNode={fullScreenNode}
      open={open}
      setOpen={setOpen}
      tokenRef={tokenRef}
    >
      {popupPage1}
      {popupPage2}
    </CodeSelectorPopup>
  );
  if (!variableMap || !tokens) popup = null;

  return [popup, triggerFunction, variableMap, open];
};

const CodeSelectorPopup = React.memo(
  ({ variable, children, fullScreenNode, open, setOpen, tokenRef }) => {
    const popupMargin = "5px";
    let position = "top left";
    let maxHeight = "100vh";

    if (tokenRef?.current) {
      // determine popup position and maxHeight/maxWidth
      const bc = tokenRef.current.getBoundingClientRect();
      const topSpace = bc.top / window.innerHeight;
      const bottomSpace = (window.innerHeight - bc.bottom) / window.innerHeight;
      if (topSpace > bottomSpace) {
        position = "top";
        maxHeight = `calc(${topSpace * 100}vh - ${popupMargin})`;
      } else {
        position = "bottom";
        maxHeight = `calc(${bottomSpace * 100}vh - ${popupMargin})`;
      }
      const leftSpace = bc.left / window.innerWidth;
      const rightSpace = (window.innerWidth - bc.right) / window.innerWidth;
      position = rightSpace > leftSpace ? position + " left" : position + " right";
    }

    // somehow onclose trigger when first opening popup. this hack enables closing it
    // when clicking outside of the popup
    let canIClose = false;

    return (
      <Popup
        mountNode={fullScreenNode || undefined}
        context={tokenRef}
        basic
        wide
        position={position}
        hoverable
        open={open}
        mouseLeaveDelay={10000000} // just don't use mouse leave
        onClose={(e, d) => {
          if (canIClose) setOpen(false);
          canIClose = true;
        }}
        style={{
          margin: popupMargin,
          padding: "0px",
          background: "#dfeffb",
          border: "1px solid #136bae",
          //backdropFilter: "blur(3px)",
          minWidth: "15em",
          maxHeight,
          overflow: "auto",
        }}
      >
        <div style={{ margin: "5px", border: "0px" }}>{children}</div>
      </Popup>
    );
  }
);

const SelectVariablePage = ({
  variable,
  setVariable,
  setExisting,
  annotations,
  selection,
  setOpen,
  variableMap,
}) => {
  const setVariableCallback = async (variable) => {
    const annMap = {};

    for (let i = selection.span[0]; i <= selection.span[1]; i++) {
      if (annotations?.[i]) {
        for (let id of Object.keys(annotations[i])) {
          const a = annotations[i][id];
          if (a.variable !== variable) continue;
          const annId = a.span[0] + "_" + id;
          annMap[annId] = { id, ...annotations[i][id] };
        }
      }
    }

    if (Object.keys(annMap).length > 0) {
      setExisting(Object.values(annMap));
    } else {
      setExisting([]);
    }

    setVariable(variable);
  };

  const getOptions = () => {
    let variables = Object.keys(variableMap);
    const variableColors = {};
    for (let v of variables) {
      const colors = {};
      for (let i = selection.span[0]; i <= selection.span[1]; i++) {
        if (!annotations[i]) continue;
        for (let id of Object.keys(annotations[i])) {
          const a = annotations[i][id];
          if (a.variable !== v) continue;
          colors[a.value] = getColor(a.value, variableMap?.[v]?.codeMap);
        }
      }
      variableColors[v] = getColorGradient(Object.values(colors));
    }

    return variables.map((variable) => ({
      color: variableColors[variable],
      label: variable,
      value: variable,
    }));
  };

  if (variable) return null;

  const options = getOptions();
  if (options.length === 1) {
    setVariableCallback(options[0].value);
  }

  return (
    <div>
      <Popup.Header style={{ textAlign: "center" }}>Select variable</Popup.Header>
      <ButtonSelection
        id={"currentCodePageButtons"}
        active={true}
        options={options}
        setOpen={setOpen}
        callback={setVariableCallback}
      />
    </div>
  );
};

const SelectAnnotationPage = ({
  tokens,
  variable,
  setVariable,
  setExisting,
  annotations,
  selection,
  setSelection,
  setOpen,
  variableMap,
}) => {
  const onButtonSelection = (value) => {
    setSelection(value.selection);
    setVariable(value.variable);
    setExisting(value.annotations);
  };

  const getAnnotationOptions = () => {
    // create an array of spans, where key is the text, and
    const variableSpans = {};

    for (let i = selection.span[0]; i <= selection.span[1]; i++) {
      if (!annotations[i]) continue;
      for (let id of Object.keys(annotations[i])) {
        const annotation = annotations[i][id];
        const codeMap = variableMap?.[annotation.variable]?.codeMap;
        if (!variableMap[annotation.variable]) continue;
        if (!codeMap?.[annotation.value]) continue;

        const span = annotation.span;
        const key = annotation.variable + ":" + span[0] + "-" + span[1];
        const label = getTextSnippet(tokens, span);
        const color = getColor(annotation.value, codeMap);
        if (!variableSpans[key]) {
          variableSpans[key] = {
            tag: annotation.variable,
            label,
            colors: [color],
            value: {
              annotations: [annotation],
              variable: annotation.variable,
              selection: annotation,
            },
          };
        } else {
          variableSpans[key].colors.push(color);
          variableSpans[key].value.annotations.push(annotation);
        }
      }
    }

    return Object.keys(variableSpans).map((key) => {
      return { ...variableSpans[key], color: getColorGradient(variableSpans[key].colors) };
    });
  };

  if (variable) return null;

  const options = getAnnotationOptions();
  if (options.length === 0) setOpen(false);
  if (options.length === 1) {
    console.log(options);
    onButtonSelection(options[0].value);
  }

  return (
    <div>
      <Popup.Header style={{ textAlign: "center" }}>Select annotation</Popup.Header>
      <ButtonSelection
        id={"currentCodePageButtons"}
        active={true}
        options={options}
        setOpen={setOpen}
        callback={onButtonSelection}
      />
    </div>
  );
};

const NewCodePage = ({
  tokens,
  variable,
  variableMap,
  codeHistory,
  settings,
  annotations,
  setAnnotations,
  selection,
  existing,
  setOpen,
  setCodeHistory,
}) => {
  const textInputRef = useRef(null);
  const [focusOnButtons, setFocusOnButtons] = useState(true);

  const onKeydown = React.useCallback(
    (event) => {
      if (settings && !settings.searchBox && !settings.buttonMode === "recent") return null;
      const focusOnTextInput = textInputRef?.current?.children[0] === document.activeElement;
      if (!focusOnTextInput) setFocusOnButtons(true);
      if (event.keyCode === 27) setOpen(false);
      if (arrowKeys.includes(event.key)) return null;
      if (event.keyCode <= 46 || event.keyCode >= 106) return null;
      if (textInputRef.current) textInputRef.current.click();
      setFocusOnButtons(false);
    },
    [textInputRef, setOpen, settings]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  });

  const onSelect = (value) => {
    updateAnnotations(
      annotations,
      variable,
      value === null, // value is null means delete, so in that case update annotations with current value (to toggle it off)
      value,
      selection,
      setAnnotations,
      setOpen,
      codeHistory,
      setCodeHistory
    );
  };

  const getOptions = () => {
    const buttonOptions = [];
    const dropdownOptions = [];
    const codeMap = variableMap?.[variable]?.codeMap;

    // const existingValueCount = Object.values(existing).reduce((em, e) => {
    //   if (!em[e.value]) em[e.value] = 0;
    //   em[e.value]++;
    //   return em;
    // }, {});

    for (let code of Object.keys(codeMap)) {
      const singleSelection = selection === null || selection?.span[0] === selection?.span[1];
      if (singleSelection && annotations[code]) continue;

      if (settings && settings.buttonMode === "all")
        buttonOptions.push({ key: code, label: code, value: code, color: getColor(code, codeMap) });

      let tree = codeMap[code].tree.join(" - ");

      // let existingmessage = null;
      // if (existingValueCount[code]) {
      //   existingmessage = (
      //     <span style={{ color: "darkred" }}>{`overwrites ${existingValueCount[code]}`}</span>
      //   );
      // }

      dropdownOptions.push({
        key: code,
        value: code,
        text: code + " test" + tree,
        content: (
          <>
            {code}
            <br />
            <span style={{ color: "grey" }}>{tree}</span>
          </>
        ),
      });
    }

    // use 'recent' mode if specified, or if settings are missing
    if (!settings || settings.buttonMode === "recent") {
      let nRecent = 9;
      for (let code of codeHistory) {
        if (nRecent < 0) break;
        if (!codeMap[code]) continue;
        buttonOptions.push({ key: code, label: code, value: code, color: getColor(code, codeMap) });
        nRecent--;
      }
    }

    if (existing && existing.length > 0) {
      for (let o of existing) {
        if (!codeMap[o.value]) continue;

        buttonOptions.push({
          box2: true,
          icon: "trash alternate",
          label: getTextSnippet(tokens, o.span),
          color: getColor(o.value, codeMap),
          value: o,
          textColor: "darkred",
        });
      }
    }

    return [buttonOptions, dropdownOptions];
  };

  const asButtonSelection = (options) => {
    // act automatically if button selection is the only mode, and there are no options or only 1
    if (settings.buttonMode === "all" && !settings.searchBox) {
      if (options.length === 0) return null;
      if (options.length === 1 && existing.length === 0) onSelect(options[0].value);
    }

    return (
      <>
        {settings.buttonMode === "recent" && codeHistory.length > 0 ? <b>Recent codes</b> : null}
        <ButtonSelection
          id={"newCodePageButtons"}
          active={focusOnButtons}
          setAnnotations={setAnnotations}
          options={options}
          setOpen={setOpen}
          callback={onSelect}
        />
      </>
    );
  };

  const asDropdownSelection = (options) => {
    if (options.length === 0) return null;
    //const codeMap = variableMap?.[variable]?.codeMap;
    //if (!codeMap) return null;

    // use searchBox if specified OR if settings are missing
    // also, if buttonmode is 'recent', always show search box
    if (settings && !settings.searchBox && settings.buttonMode !== "recent") return null;

    return (
      <Ref innerRef={textInputRef}>
        <Dropdown
          fluid
          placeholder={"<type to search>"}
          style={{
            textAlign: "center",
            color: "black",
            minWidth: "12em",
            width: "100%",
            marginBottom: "10px",
          }}
          options={options}
          open={!focusOnButtons}
          search
          compact
          selectOnNavigation={false}
          minCharacters={0}
          autoComplete={"on"}
          onClick={() => setFocusOnButtons(false)}
          onSearchChange={(e, d) => {
            if (d.searchQuery === "") setFocusOnButtons(true);
          }}
          onClose={() => setFocusOnButtons(true)}
          onChange={(e, d) => onSelect(d.value)}
        />
      </Ref>
    );
  };

  if (!variable) return null;

  const [buttonOptions, dropdownOptions] = getOptions();

  return (
    <>
      {asDropdownSelection(dropdownOptions)}
      {asButtonSelection(buttonOptions)}
    </>
  );
};

const getTextSnippet = (tokens, span, maxlength = 8) => {
  let text = tokens.slice(span[0], span[1] + 1).map((t) => t.pre + t.text + t.post);
  if (text.length > maxlength)
    text = [
      text.slice(0, Math.floor(maxlength / 2)).join(""),
      " ... ",
      text.slice(-Math.floor(maxlength / 2)).join(""),
    ];
  return text.join("");
};

const updateAnnotations = (
  annotations,
  variable,
  deleteCurrent,
  value,
  selection,
  setAnnotations,
  setOpen,
  codeHistory,
  setCodeHistory
) => {
  if (!annotations) {
    setOpen(false);
    return null;
  }

  let rmAnnotation = { ...selection, variable };
  if (deleteCurrent) {
    setAnnotations((state) => toggleSpanAnnotation({ ...state }, rmAnnotation, true));
    setOpen(false);
    return null;
  }

  let newAnnotation = { ...selection, variable, value };
  setAnnotations((state) => {
    const newstate = toggleSpanAnnotation({ ...state }, rmAnnotation, true);
    return toggleSpanAnnotation(newstate, newAnnotation, false);
  });
  setCodeHistory((state) => {
    return {
      ...state,
      [variable]: [value, ...codeHistory.filter((v) => v !== value)],
    };
  });
  setOpen(false);
};

export default useCodeSelector;

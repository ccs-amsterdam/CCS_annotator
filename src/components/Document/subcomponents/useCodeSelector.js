import React, { useState, useEffect, useRef } from "react";
import { Dropdown, Popup, Ref } from "semantic-ui-react";
import { toggleSpanAnnotation } from "library/annotations";
import { codeBookEdgesToMap } from "library/codebook";
import { getColor, getColorGradient } from "library/tokenDesign";
import ButtonSelection from "./ButtonSelection";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

/**
 * This hook is an absolute beast, as it takes care of a lot of moving parts.
 * Basically, everything surrounding the popups for selecting and editing codes, and updating the annotations
 * Please don't touch it untill I get around to refactoring it, and then still don't touch it unless strictly needed
 *
 * The weirdest (but nice) part is that it returns a popup component, as well as a 'trigger' function.
 * The trigger function can then be used to trigger a popup for starting a selection or edit for a given token index (position of popup)
 * and selection (which span to create/edit)
 *
 * @param {*} tokens
 * @param {*} variables
 * @param {*} selectedVariable
 * @param {*} annotations
 * @param {*} setAnnotations
 * @param {*} codeHistory
 * @param {*} setCodeHistory
 * @param {*} fullScreenNode
 * @returns
 */
const useCodeSelector = (
  tokens,
  variables,
  selectedVariable,
  annotations,
  setAnnotations,
  codeHistory,
  setCodeHistory,
  fullScreenNode
) => {
  const [open, setOpen] = useState(false);
  const [span, setSpan] = useState(null);
  const [variable, setVariable] = useState(null);
  const [tokenRef, setTokenRef] = useState(null);
  const [tokenAnnotations, setTokenAnnotations] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [tmpCodeHistory, setTmpCodeHistory] = useState(codeHistory); // to not update during selection

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

    let vmap;
    if (selectedVariable === null || selectedVariable === "EDIT ALL") {
      vmap = fullVariableMap;
    } else {
      vmap = { [selectedVariable]: fullVariableMap[selectedVariable] };
    }

    setVariableMap(vmap);
    setEditMode(vmap?.[selectedVariable]?.editMode || selectedVariable === "EDIT ALL");
  }, [fullVariableMap, selectedVariable, setVariable, setVariableMap, setEditMode]);

  useEffect(() => {
    if (open) return;
    setCodeHistory(tmpCodeHistory);
  }, [tmpCodeHistory, open, setCodeHistory]);

  const triggerFunction = React.useCallback(
    (index, span) => {
      if (!tokens[index].ref) return;
      setTokenRef(tokens[index].ref);
      setTokenAnnotations(annotations[index] || {});
      setSpan(span || [index, index]);
      setOpen(true);
    },
    [annotations, tokens]
  );

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
        variableMap={variableMap}
        annotations={annotations}
        span={span}
        setSpan={setSpan}
        setOpen={setOpen}
      />
    );
  } else {
    popupPage1 = (
      <SelectVariablePage
        variable={variable}
        setVariable={setVariable}
        variableMap={variableMap}
        annotations={annotations}
        span={span}
        setOpen={setOpen}
      />
    );
  }

  let popupPage2 = (
    <NewCodePage // if current is known, select what the new code should be (or delete, or ignore)
      tokens={tokens}
      variable={variable}
      variableMap={variableMap}
      settings={variableMap?.[variable]}
      codeHistory={codeHistory[variable] || []}
      annotations={annotations}
      tokenAnnotations={tokenAnnotations}
      setAnnotations={setAnnotations}
      span={span}
      editMode={editMode}
      setOpen={setOpen}
      setCodeHistory={setTmpCodeHistory}
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

  return [popup, triggerFunction, variableMap, open, editMode];
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

const SelectVariablePage = ({ variable, setVariable, annotations, span, setOpen, variableMap }) => {
  const getOptions = () => {
    let variables = Object.keys(variableMap);
    const variableColors = {};
    for (let v of variables) {
      const colors = {};
      for (let i = span[0]; i <= span[1]; i++) {
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

  if (variable || !span) return null;

  const options = getOptions();
  if (options.length === 1) {
    setVariable(options[0].value);
  }

  return (
    <div>
      <Popup.Header style={{ textAlign: "center" }}>Select variable</Popup.Header>
      <ButtonSelection
        id={"currentCodePageButtons"}
        active={true}
        options={options}
        setOpen={setOpen}
        onSelect={(value, ctrlKey) => {
          if (value === "CANCEL") {
            setOpen(false);
            return;
          }
          setVariable(value);
        }}
      />
    </div>
  );
};

const SelectAnnotationPage = ({
  tokens,
  variable,
  setVariable,
  annotations,
  span,
  setSpan,
  setOpen,
  variableMap,
}) => {
  const onButtonSelection = (value, ctrlKey) => {
    if (value === "CANCEL") {
      setOpen(false);
      return;
    }
    setSpan(value.span);
    setVariable(value.variable);
    //setExisting(value.annotations);
  };

  const getAnnotationOptions = () => {
    // create an array of spans, where key is the text, and
    const variableSpans = {};

    for (let i = span[0]; i <= span[1]; i++) {
      if (!annotations[i]) continue;
      for (let id of Object.keys(annotations[i])) {
        const annotation = annotations[i][id];
        const codeMap = variableMap?.[annotation.variable]?.codeMap;
        if (!variableMap[annotation.variable]) continue;
        if (!codeMap?.[annotation.value] && annotation.value !== "EMPTY") continue;

        const span = annotation.span;
        const key = annotation.variable + ":" + span[0] + "-" + span[1];
        const label = '"' + getTextSnippet(tokens, span) + '"';
        const color = getColor(annotation.value, codeMap);
        if (!variableSpans[key]) {
          variableSpans[key] = {
            tag: annotation.variable,
            label,
            colors: [color],
            value: {
              //annotations: [annotation],
              variable: annotation.variable,
              span: annotation.span,
            },
          };
        } else {
          variableSpans[key].colors.push(color);
          //variableSpans[key].value.annotations.push(annotation);
        }
      }
    }

    return Object.keys(variableSpans).map((key) => {
      return { ...variableSpans[key], color: getColorGradient(variableSpans[key].colors) };
    });
  };

  if (variable || !span) return null;

  const options = getAnnotationOptions();
  if (options.length === 0) setOpen(false);
  if (options.length === 1) {
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
        onSelect={onButtonSelection}
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
  tokenAnnotations,
  setAnnotations,
  editMode,
  span,
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

  const getExistingAnnotations = (variable) => {
    const annMap = {};

    for (let i = span[0]; i <= span[1]; i++) {
      if (annotations?.[i]) {
        for (let id of Object.keys(annotations[i])) {
          const a = annotations[i][id];
          if (a.variable !== variable) continue;
          const annId = a.span[0] + "_" + id;
          annMap[annId] = { id, ...annotations[i][id] };
        }
      }
    }

    return Object.keys(annMap).length > 0 ? Object.values(annMap) : [];
  };

  useEffect(() => {
    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  });

  const onSelect = (annotation, ctrlKey) => {
    if (annotation === "CANCEL") {
      setOpen(false);
      return;
    }
    updateAnnotations(tokens, annotation, setAnnotations, codeHistory, setCodeHistory, editMode);

    if (!variableMap?.[variable]?.multiple && !ctrlKey) setOpen(false);
  };

  const autoCode = (codeMap, existing) => {
    const codes = Object.keys(codeMap);
    if (codes.length !== 1) return null;

    const value = codes[0];
    const nonEmpty = existing.filter((e) => e.value !== "EMPTY");
    if (nonEmpty.length === 0) {
      // If there is only one option (which only happens if there is only 1 possible value and nothing that can be deleted), select it automatically
      setTimeout(() => onSelect({ variable, span, value, delete: false }), 0);
      setOpen(false);
    }
    if (editMode && nonEmpty.length === 1 && value === nonEmpty[0].value) {
      setTimeout(() => onSelect({ variable, span, value, delete: true }), 0);
      setOpen(false);
    }
  };

  const getOptions = () => {
    const existing = getExistingAnnotations(variable);
    const buttonOptions = [];
    const dropdownOptions = [];
    const codeMap = variableMap?.[variable]?.codeMap;
    autoCode(codeMap, existing);

    for (let code of Object.keys(codeMap)) {
      const singleSelection = span === null || span[0] === span[1];
      if (singleSelection && tokenAnnotations[code]) continue;

      if (settings && settings.buttonMode === "all")
        buttonOptions.push({
          key: code,
          label: code,
          value: { variable, value: code, span, delete: false },
          color: getColor(code, codeMap),
        });

      let tree = codeMap[code].tree.join(" - ");

      dropdownOptions.push({
        key: code,
        value: { variable, value: code, span, delete: false },
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
        buttonOptions.push({
          key: code,
          label: code,
          value: { variable, value: code, span, delete: false },
          color: getColor(code, codeMap),
        });
        nRecent--;
      }
    }

    if (existing && existing.length > 0) {
      for (let o of existing) {
        if (!codeMap[o.value]) continue;

        buttonOptions.push({
          tag: o.value,
          label: '"' + getTextSnippet(tokens, o.span) + '"',
          color: getColor(o.value, codeMap),
          value: { ...o, delete: true },
          textColor: "darkred",
        });
      }
    }

    return [buttonOptions, dropdownOptions];
  };

  const asButtonSelection = (options) => {
    // act automatically if button selection is the only mode, and there are no options or only 1
    // if (settings.buttonMode === "all" && !settings.searchBox) {
    //   if (options.length === 0) return null;

    //   if (options.length === 1) {
    //     // If there is only one option (which only happens if there is only 1 possible value and nothing that can be deleted), select it automatically
    //     setTimeout(() => onSelect(options[0].value), 0);
    //     setOpen(false);
    //   }
    //   if (
    //     editMode &&
    //     options.length === 2 &&
    //     (options[0].value.delete || options[1].value.delete)
    //   ) {
    //     // In editmode, if there is only 1 possible value, and it has already been selected, delete it automatically
    //     // Basically this means that for binary variables, clicking in edit mode equals toggling
    //     if (options[0].value.value === options[1].value.value) {
    //       setTimeout(() => onSelect({ ...options[0].value, delete: true }), 0);
    //       setOpen(false);
    //     }
    //   }
    // }

    return (
      <>
        {settings.buttonMode === "recent" && codeHistory.length > 0 ? <b>Recent codes</b> : null}
        <ButtonSelection
          id={"newCodePageButtons"}
          active={focusOnButtons}
          setAnnotations={setAnnotations}
          options={options}
          setOpen={setOpen}
          onSelect={onSelect}
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
    if (settings && !settings.searchBox && settings.buttonMode !== "recent")
      return <div style={{ height: "25px" }} />;

    return (
      <Ref innerRef={textInputRef}>
        <Dropdown
          fluid
          placeholder={"<type to search>"}
          style={{
            textAlign: "center",
            color: "black",
            width: "100%",
            height: "20px",
            marginBottom: "5px",
            overflow: "visible",
            position: "relative",
          }}
          options={options}
          open={!focusOnButtons}
          search
          selectOnNavigation={false}
          minCharacters={0}
          autoComplete={"on"}
          onClick={() => setFocusOnButtons(false)}
          onSearchChange={(e, d) => {
            if (d.searchQuery === "") setFocusOnButtons(true);
          }}
          onClose={() => setFocusOnButtons(true)}
          onChange={(e, d) => {
            onSelect(d.value, e.ctrlKey);
          }}
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
  tokens,
  annotation,
  setAnnotations,
  codeHistory,
  setCodeHistory,
  editMode
) => {
  const [from, to] = annotation.span;
  annotation.index = tokens[from].index;
  annotation.length = tokens[to].length + tokens[to].offset - tokens[from].offset;
  annotation.span = [tokens[from].index, tokens[to].index];
  annotation.section = tokens[from].section;
  annotation.offset = tokens[from].offset;

  setAnnotations((state) =>
    toggleSpanAnnotation({ ...state }, annotation, annotation.delete, editMode)
  );
  setCodeHistory((state) => {
    return {
      ...state,
      [annotation.variable]: [
        annotation.value,
        ...codeHistory.filter((v) => v !== annotation.value),
      ],
    };
  });
};

export default useCodeSelector;

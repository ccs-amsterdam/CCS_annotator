import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Header, Button, Dropdown, Ref, Segment } from "semantic-ui-react";
import { getColor } from "../util/tokenDesign";

import { moveUp, moveDown } from "../util/buttonNav";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const QuestionForm = ({ doc }) => {
  const settings = useSelector(state => state.itemSettings.questionForm);
  const codeMap = useSelector(state => state.codeMap);
  if (!settings) return null;

  const onSelect = code => {
    alert("You selected a code, but nothing happens!! Woe is upon you!!");
  };

  return (
    <Segment style={{ height: "100%", border: "0", backgroundColor: "#bcbcf133" }}>
      <Header textAlign="center">{prepareQuestion(doc, settings, codeMap)}</Header>
      {settings.type === "search code" ? <SearchBoxDropdown callback={onSelect} /> : null}
      {settings.type === "select code" ? <ButtonSelection callback={onSelect} /> : null}
    </Segment>
  );
};

const getOptions = codeMap => {
  return Object.keys(codeMap).reduce((options, code) => {
    if (!codeMap[code].active) return options;
    if (!codeMap[code].activeParent) return options;
    let tree = codeMap[code].tree.join(" - ");
    if (tree === "") tree = "Root";
    options.push({
      ref: React.createRef(),
      code: code,
      tree: tree,
      color: getColor(code, codeMap),
    });
    return options;
  }, []);
};

const prepareQuestion = (doc, settings, codeMap) => {
  let question = settings.question;

  if (question.search("\\[code\\]") >= 0) {
    if (doc.itemAnnotation) {
      let code = doc.itemAnnotation.group;
      const codeTag = `{{lightyellow###${code}}}`; // add optional color from itemSettings
      question = question.replace("[code]", codeTag);
    }
  }

  if (question.search("\\[group\\]") >= 0) {
    if (doc.itemAnnotation) {
      let code = doc.itemAnnotation.group;
      if (codeMap[code].foldToParent) code = codeMap[code].foldToParent;
      const codeTag = `{{yellow###${code}}}`; // add optional color from itemSettings
      question = question.replace("[group]", codeTag);
    }
  }

  if (question.search("\\[text\\]") >= 0) {
    if (doc.itemAnnotation?.span != null) {
      const text = doc.tokens.reduce((str, token) => {
        const i = token.index;
        const [from, to] = doc.itemAnnotation.span;
        if (i === from && i === to) str += token.text;
        if (i === from && i < to) str += token.text + token.post;
        if (i > from && i < to) str += token.pre + token.text + token.post;
        if (i > from && i === to) str += token.text + token.post;
        return str;
      }, "");
      const textTag = `{{lightblue###${text}}}`; // add optional color from itemSettings

      question = question.replace("[text]", textTag);
    }
  }
  return markedString(question);
};

const markedString = text => {
  const regex = new RegExp(/\{\{(.*?)\}\}/); // Match text inside two square brackets

  return (
    <div>
      {text.split(regex).reduce((prev, current, i) => {
        if (i % 2 === 0) {
          prev.push(current);
        } else {
          const [color, string] = current.split("###");
          prev.push(
            <mark key={i + current} style={{ backgroundColor: color }}>
              {string}
            </mark>
          );
        }
        return prev;
      }, [])}
    </div>
  );
};

const SearchBoxDropdown = ({ callback }) => {
  const ref = useRef();
  const options = useSelector(state => getOptions(state.codeMap));

  return (
    <Ref innerRef={ref}>
      <Dropdown
        fluid
        placeholder={"<type to search>"}
        searchInput={{ autoFocus: true }}
        style={{ minWidth: "12em" }}
        options={options.map(option => {
          return {
            key: option.code,
            value: option.code,
            text: option.code + " (" + option.tree + ")",
            content: (
              <>
                {option.code}
                <br />
                <span style={{ color: "grey" }}>{option.tree}</span>
              </>
            ),
          };
        })}
        search
        selection
        compact
        selectOnNavigation={false}
        minCharacters={0}
        autoComplete={"on"}
        onChange={(e, d) => {
          callback(d.value);
        }}
      />
    </Ref>
  );
};

const ButtonSelection = ({ callback }) => {
  // render buttons for options (an array of objects with keys 'label' and 'color')
  // On selection perform callback function with the button label as input
  // if canDelete is TRUE, also contains a delete button, which passes null to callback
  const options = useSelector(state => getOptions(state.codeMap));
  const eventsBlocked = useSelector(state => state.eventsBlocked);

  const [selected, setSelected] = useState(0);

  const onKeydown = React.useCallback(
    event => {
      const nbuttons = options.length;

      // any arrowkey
      if (arrowKeys.includes(event.key)) {
        event.preventDefault();

        if (event.key === "ArrowRight") {
          if (selected < nbuttons - 1) setSelected(selected + 1);
        }

        if (event.key === "ArrowDown") {
          setSelected(
            moveDown(
              options.map(option => option.ref),
              selected
            )
          );
        }

        if (event.key === "ArrowLeft") {
          if (selected > 0) setSelected(selected - 1);
        }

        if (event.key === "ArrowUp") {
          setSelected(
            moveUp(
              options.map(option => option.ref),
              selected
            )
          );
        }

        return;
      }

      // delete
      if (event.keyCode === 46) callback(null);

      // space or enter
      if (event.keyCode === 32 || event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();

        if (selected === options.length) {
          callback(null); // this means delete button was selected
        } else {
          callback(options[selected].code);
        }
      }
    },
    [selected, callback, options]
  );

  useEffect(() => {
    if (!eventsBlocked) {
      window.addEventListener("keydown", onKeydown);
    } else window.removeEventListener("keydown", onKeydown);

    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, [onKeydown, eventsBlocked]);

  const mapButtons = () => {
    return options.map((option, i) => {
      return (
        <>
          <Ref innerRef={option.ref}>
            <Button
              style={{ backgroundColor: option.color, margin: "0", padding: "2em" }}
              key={option.code}
              value={option.code}
              compact
              size="mini"
              active={i === selected}
              onMouseOver={() => setSelected(i)}
              onClick={(e, d) => callback(d.value)}
            >
              {/* <div
                style={{
                  position: "relative",
                  float: "left",
                  fontStyle: "bold",
                  marginTop: "-0.5em",
                  marginLeft: "-1em",
                }}
              >
                {i + 1}
              </div> */}
              {" " + option.code}
            </Button>
          </Ref>
        </>
      );
    });
  };

  return <div style={{ textAlign: "center" }}>{mapButtons()}</div>;
};

export default QuestionForm;

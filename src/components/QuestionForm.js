import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Header, Button, Dropdown, Grid, Ref } from "semantic-ui-react";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const QuestionForm = ({ doc }) => {
  const settings = useSelector((state) => state.itemSettings.questionForm);

  const prepareQuestion = (question) => {
    if (question.search("\\[code\\]") >= 0) {
      if (doc.itemAnnotation) {
        const codeTag = `{{lightyellow###${doc.itemAnnotation.group}}}`; // add optional color from itemSettings
        question = question.replace("[code]", codeTag);
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

  return <Header textAlign="center">{prepareQuestion(settings.question)}</Header>;
};

const markedString = (text) => {
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

const SearchBoxDropdown = () => {
  const ref = useRef();
  const codeMap = useSelector((state) => state.codeMap);

  return (
    <>
      <Grid>
        <Grid.Column width={13} floated="left">
          <Ref innerRef={ref}>
            <Dropdown
              fluid
              placeholder={"<type to search>"}
              style={{ minWidth: "12em" }}
              options={Object.keys(codeMap).reduce((options, code) => {
                let tree = codeMap[code].tree.join(" - ");
                if (tree === "") tree = "Root";
                options.push({
                  key: code,
                  value: code,
                  text: code + " " + tree,
                  content: (
                    <>
                      {code}
                      <br />
                      <span style={{ color: "grey" }}>{tree}</span>
                    </>
                  ),
                });

                return options;
              }, [])}
              search
              selection
              compact
              selectOnNavigation={false}
              minCharacters={0}
              autoComplete={"on"}
              onChange={(e, d) => {
                if (codeMap[d.value]) console.log(d.value);
              }}
            />
          </Ref>
        </Grid.Column>
      </Grid>
      <br />
    </>
  );
};

const ButtonSelection = ({ active, options, canDelete, callback }) => {
  // render buttons for options (an array of objects with keys 'label' and 'color')
  // On selection perform callback function with the button label as input
  // if canDelete is TRUE, also contains a delete button, which passes null to callback
  const itemSettings = useSelector((state) => state.itemSettings);
  const [selected, setSelected] = useState(0);

  const rowSize = itemSettings?.codeSelector?.rowSize || 5;

  const onKeydown = React.useCallback(
    (event) => {
      const nbuttons = canDelete ? options.length + 1 : options.length;

      // any arrowkey
      if (arrowKeys.includes(event.key)) {
        event.preventDefault();

        if (event.key === "ArrowRight") {
          if (selected < nbuttons - 1) setSelected(selected + 1);
        }

        if (event.key === "ArrowDown") {
          if (selected < nbuttons - 1) setSelected(Math.min(selected + rowSize, nbuttons - 1));
        }

        if (event.key === "ArrowLeft") {
          if (selected > 0) setSelected(selected - 1);
        }

        if (event.key === "ArrowUp") {
          if (selected > 0) setSelected(Math.max(0, selected - rowSize));
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
          callback(options[selected].label);
        }
      }
    },
    [selected, callback, options, canDelete, rowSize]
  );

  useEffect(() => {
    if (active) {
      window.addEventListener("keydown", onKeydown);
    } else {
      window.removeEventListener("keydown", onKeydown);
    }
    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, [active, onKeydown]);

  const mapButtons = () => {
    return options.map((option, i) => {
      return (
        <>
          {i % rowSize === 0 ? <br /> : null}
          <Button
            style={{ backgroundColor: option.color, margin: "0" }}
            key={option.label}
            value={option.label}
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
            {" " + option.label}
          </Button>
        </>
      );
    });
  };

  const deleteButton = () => {
    if (!canDelete) return null;
    return (
      <Button
        icon="trash"
        size="mini"
        floated="right"
        active={selected === options.length}
        compact
        style={{ backgroundColor: "red", borderColor: "black" }}
        onMouseOver={() => setSelected(options.length)}
        onClick={(e, d) => callback(null)}
      />
    );
  };

  return (
    <span>
      {mapButtons()}
      {deleteButton()}
    </span>
  );
};

export default QuestionForm;

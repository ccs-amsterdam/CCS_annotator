import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Header, Button, Dropdown, Ref, Segment } from "semantic-ui-react";
import { moveUp, moveDown } from "util/refNavigation";
import { setAnnotations, setQuestionIndex } from "actions";
import { codeBookEdgesToMap, getCodeTreeArray } from "util/codebook";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const QuestionForm = ({ itemBundle, codebook, preview }) => {
  const questionIndex = useSelector((state) => state.questionIndex);
  const [settings, setSettings] = useState();

  const dispatch = useDispatch();

  useEffect(() => {
    // settings is an array with the settings for each question
    // This needs a little preprocessing, so we only update it when codebook changes (not per item)
    if (!codebook?.taskSettings?.questions) return null;
    setSettings(prepareSettings(codebook));
  }, [codebook, setSettings]);

  if (!settings) return null;

  // rawQuestion is only the text (used for saving results). question is the jsx
  const [rawQuestion, question] = prepareQuestion(itemBundle, settings[questionIndex]);
  const currentAnswer = getCurrentAnswer(itemBundle);

  const onSelect = (answer) => {
    setNewAnswer(itemBundle, rawQuestion, answer, dispatch);
  };

  const questionIndexStep = () => {
    if (settings.length === 1) return null;
    return (
      <Button.Group style={{ marginLeft: "1em", marginTop: "0", float: "right" }}>
        {settings.map((q, i) => {
          return (
            <Button
              active={i === questionIndex}
              onClick={() => dispatch(setQuestionIndex(i))}
              style={{ padding: "0.2em", minWidth: "1.3em", background: "grey", color: "white" }}
            >
              {i + 1}
            </Button>
          );
        })}
      </Button.Group>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexFlow: "column",
        height: "100%",
        maxHeight: "100%",
        padding: "1em",
        margin: "1em",
        color: "white",
        borderTop: "5px double grey",
        backgroundColor: currentAnswer == null ? "#1B1C1D" : "#1B1C1D",
      }}
    >
      <div style={{ width: "100%" }}>
        {questionIndexStep()}
        <div style={{}}>
          <Header as="h2" style={{ color: "white" }}>
            {settings[questionIndex].name}
          </Header>
        </div>
      </div>
      <p>{question}</p>
      {showCurrent(currentAnswer)}
      <Segment
        style={{
          flex: "1 1 auto",
          padding: "0.1em",
          overflowX: "auto",
          height: "100%",
        }}
      >
        {settings[questionIndex].type === "search code" ? (
          <SearchBoxDropdown options={settings[questionIndex].options} callback={onSelect} />
        ) : null}
        {settings[questionIndex].type === "select code" ? (
          <ButtonSelection
            options={settings[questionIndex].options}
            callback={onSelect}
            preview={preview}
          />
        ) : null}
      </Segment>
    </div>
  );
};

const prepareSettings = (codebook) => {
  const questions = codebook.taskSettings.questions;

  return questions.map((question) => {
    const codeMap = codeBookEdgesToMap(question.codes);
    const cta = getCodeTreeArray(codeMap);
    return { ...question, options: getOptions(cta) }; // note that it's important that this deep copies question
  });
};

const getOptions = (cta) => {
  return cta.reduce((options, code) => {
    if (!code.active) return options;
    if (!code.activeParent) return options;
    let tree = code.tree.join(" - ");
    //if (tree === "") tree = "Root";
    options.push({
      //ref: React.createRef(),
      code: code.code,
      tree: tree,
      color: code.color,
    });
    return options;
  }, []);
};

const setNewAnswer = (itemBundle, rawQuestion, answer, dispatch) => {
  const newAnnotations = { ...itemBundle.annotations };
  const root = ""; // this is just a placeholder. Need to add setting for question mode task that a root from the codebook is used

  const textUnit = itemBundle.item.textUnit;
  const unitIndex = itemBundle.item.unitIndex;

  if (!newAnnotations[textUnit][unitIndex]) newAnnotations[textUnit][unitIndex] = {};

  newAnnotations[textUnit][unitIndex][root] = { question: rawQuestion, answer: answer };

  dispatch(setAnnotations({ ...newAnnotations }));
};

const getCurrentAnswer = (itemBundle) => {
  const root = ""; // this is just a placeholder. Need to add setting for question mode task that a root from the codebook is used
  return itemBundle.annotations[itemBundle.textUnit]?.[itemBundle.unitIndex]?.[root]?.answer;
};

const showCurrent = (currentAnswer) => {
  if (currentAnswer == null) return null;
  return (
    <div style={{ backgroundColor: "white" }}>
      <Segment
        style={{
          backgroundColor: currentAnswer,
          padding: "0.2em",
          margin: "0",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "1.5em", marginTop: "0.3em" }}>{currentAnswer}</div>
        <div style={{ float: "left", fontStyle: "italic" }}>selected</div>{" "}
        <div style={{ textAlign: "right", fontStyle: "italic" }}>select again to continue</div>
      </Segment>
    </div>
  );
};

const prepareQuestion = (itemBundle, settings) => {
  let question = settings.question;
  let rawQuestion = settings.question;

  if (question.search("\\[code\\]") >= 0) {
    if (itemBundle.annotation) {
      let code = itemBundle.annotation.group;
      const codeTag = `{{lightyellow###${code}}}`; // add optional color from itemSettings
      question = question.replace("[code]", codeTag);
      rawQuestion = rawQuestion.replace("[code]", code);
    }
  }

  // if (question.search("\\[group\\]") >= 0) {
  //   if (itemBundle.annotation) {
  //     let code = itemBundle.annotation.group;
  //     if (itemBundle.codeMap[code].foldToParent) code = itemBundle.codeMap[code].foldToParent;
  //     const codeTag = `{{yellow###${code}}}`; // add optional color from itemSettings
  //     question = question.replace("[group]", codeTag);
  //     rawQuestion = rawQuestion.replace("[code]", code);
  //   }
  // }

  // if (question.search("\\[text\\]") >= 0) {
  //   if (item.annotation?.span != null) {
  //     const text = tokens.reduce((str, token) => {
  //       const i = token.index;
  //       const [from, to] = item.annotation.span;
  //       if (i === from && i === to) str += token.text;
  //       if (i === from && i < to) str += token.text + token.post;
  //       if (i > from && i < to) str += token.pre + token.text + token.post;
  //       if (i > from && i === to) str += token.text + token.post;
  //       return str;
  //     }, "");
  //     const textTag = `{{lightblue###${text}}}`; // add optional color from itemSettings

  //     question = question.replace("[text]", textTag);
  //     rawQuestion = rawQuestion.replace("[code]", text);
  //   }
  // }

  return [rawQuestion, markedString(question)];
};

const markedString = (text) => {
  const regex = new RegExp(/{{(.*?)}}/); // Match text inside two square brackets

  text = text.replace(/(\r\n|\n|\r)/gm, "");
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

const SearchBoxDropdown = React.memo(({ options, callback }) => {
  const ref = useRef();

  return (
    <Ref innerRef={ref}>
      <Dropdown
        fluid
        placeholder={"<type to search>"}
        searchInput={{ autoFocus: true }}
        style={{ minWidth: "12em" }}
        options={options.map((option) => {
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
});

const ButtonSelection = React.memo(({ options, callback, preview }) => {
  // render buttons for options (an array of objects with keys 'label' and 'color')
  // On selection perform callback function with the button label as input
  // if canDelete is TRUE, also contains a delete button, which passes null to callback
  const eventsBlocked = useSelector((state) => state.eventsBlocked);

  const [selected, setSelected] = useState(0);

  const onKeydown = React.useCallback(
    (event) => {
      const nbuttons = options.length;

      // any arrowkey
      if (arrowKeys.includes(event.key)) {
        event.preventDefault();

        if (event.key === "ArrowRight") {
          if (selected < nbuttons - 1) setSelected(selected + 1);
        }

        if (event.key === "ArrowDown") {
          setSelected(moveDown(options, selected));
        }

        if (event.key === "ArrowLeft") {
          if (selected > 0) setSelected(selected - 1);
        }

        if (event.key === "ArrowUp") {
          setSelected(moveUp(options, selected));
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
    if (!eventsBlocked && !preview) {
      window.addEventListener("keydown", onKeydown);
    } else window.removeEventListener("keydown", onKeydown);

    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, [onKeydown, eventsBlocked, preview]);

  const mapButtons = () => {
    return options.map((option, i) => {
      return (
        <>
          <Ref innerRef={option.ref}>
            <Button
              style={{
                backgroundColor: option.color,
                padding: "1em",
                margin: "0.2em",
                border: i === selected ? "3px solid black" : "3px solid #ece9e9",
              }}
              key={option.code}
              value={option.code}
              compact
              //active={i === selected}
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

  return (
    <div
      style={{
        display: "table-cell",
        verticalAlign: "middle",
        textAlign: "center",
      }}
    >
      {mapButtons()}
    </div>
  );
});

export default QuestionForm;

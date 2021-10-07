import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Header, Button, Dropdown, Ref, Segment, Icon } from "semantic-ui-react";
import { moveUp, moveDown } from "util/refNavigation";
import { finishedUnit, setAnnotations } from "actions";
import { codeBookEdgesToMap, getCodeTreeArray } from "util/codebook";
import { useSwipeable } from "react-swipeable";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const QuestionForm = ({ itemBundle, codebook, questionIndex, preview }) => {
  const [settings, setSettings] = useState();
  const [answerTransition, setAnswerTransition] = useState();
  const dispatch = useDispatch();
  const answered = useRef(false); // to prevent answering double (e.g. with swipe events)

  useEffect(() => {
    answered.current = false;
  }, [itemBundle]);

  useEffect(() => {
    // settings is an array with the settings for each question
    // This needs a little preprocessing, so we only update it when codebook changes (not per item)
    if (!codebook?.questions) return null;
    setSettings(prepareSettings(codebook));
  }, [codebook, setSettings]);

  if (!settings || !itemBundle) return null;

  // rawQuestion is only the text (used for saving results). question is the jsx
  const [rawQuestion, question] = prepareQuestion(itemBundle, settings[questionIndex]);
  const currentAnswer = getCurrentAnswer(itemBundle);

  const onSelect = (answer) => {
    if (answered.current) return null;
    answered.current = true;
    setNewAnswer(itemBundle, questionIndex, rawQuestion, answer.code, dispatch);
    setAnswerTransition(answer);
    if (questionIndex === itemBundle.codebook.questions.length - 1) {
      setTimeout(() => {
        // wait a little bit, so coder can confirm their answer
        setAnswerTransition(null);
        dispatch(finishedUnit());
      }, 500);
    }
  };

  const questionIndexStep = () => {
    if (settings.length === 1) return null;
    return (
      <Button.Group style={{ marginLeft: "1em", marginTop: "0", float: "right" }}>
        {settings.map((q, i) => {
          return (
            <Button
              active={i === questionIndex}
              // onClick={() => dispatch(setQuestionIndex(i))}
              style={{ padding: "0.2em", minWidth: "1.3em", background: "grey", color: "white" }}
            >
              {i + 1}
            </Button>
          );
        })}
      </Button.Group>
    );
  };

  const renderAnswerSegment = () => {
    if (answerTransition)
      return (
        <Segment
          style={{
            height: "100%",
            width: "100%",
            background: answerTransition.color,
            textAlign: "center",
          }}
        >
          <Header as="h1">{answerTransition.code}</Header>
        </Segment>
      );
    return (
      <>
        {showCurrent(currentAnswer || answerTransition)}
        <Segment
          style={{
            flex: "1 1 auto",
            padding: "0",
            overflowY: "auto",
            height: "100%",
            width: "100%",
            margin: "0",
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
          {settings[questionIndex].type === "annotinder" ? (
            <Annotinder
              options={settings[questionIndex].options}
              currentAnswer={currentAnswer}
              callback={onSelect}
              preview={preview}
            />
          ) : null}
        </Segment>
      </>
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

      {renderAnswerSegment()}
    </div>
  );
};

const prepareSettings = (codebook) => {
  const questions = codebook.questions;

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
      ref: React.createRef(),
      code: code.code,
      tree: tree,
      swipe: code.swipe,
      color: code.color,
    });
    return options;
  }, []);
};

const setNewAnswer = (itemBundle, questionIndex, rawQuestion, answer, dispatch) => {
  const newAnnotations = { ...itemBundle.annotations };

  const question = itemBundle.codebook.questions[questionIndex].name;
  const group = questionIndex + ": " + question;

  const section = itemBundle.tokens.reduce((obj, token) => {
    if (token.codingUnit && !obj[token.section]) obj[token.section] = 1;
    return obj;
  }, {});

  const span = itemBundle.textUnitSpan;
  const annotation = {
    question,
    questionIndex,
    value: answer,
    section: Object.keys(section).join("+"),
    offset: span[0],
    length: span[1] - span[0],
  };

  if (!newAnnotations["span"]["unit"]) newAnnotations["span"]["unit"] = {};
  newAnnotations["span"]["unit"][group] = annotation;
  dispatch(setAnnotations({ ...newAnnotations }));
};

const getCurrentAnswer = (itemBundle) => {
  // this needs to be 10x prettier or something
  return itemBundle.annotations[itemBundle.textUnit]?.[itemBundle.unitIndex]?.["unit"]?.answer;
};

const showCurrent = (currentAnswer) => {
  if (currentAnswer == null) return null;
  return (
    <div style={{ backgroundColor: "white", color: "black" }}>
      <Segment
        style={{
          padding: "0.2em",
          margin: "0",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "1.5em", marginTop: "0.3em" }}>
          You answered <b>{`${currentAnswer}`}</b>
        </div>
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
            value: option,
            text: option.code + (option.tree ? " (" + option.tree + ")" : ""),
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
          callback(options[selected]);
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
                flex: "1 1 auto",
                border: i === selected ? "3px solid black" : "3px solid #ece9e9",
              }}
              key={option.code}
              value={option}
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
        display: "flex",
        //alignItems: "stretch",
        alignContent: "stretch",
        maxWidth: "100%",
        height: "100%",
        flexWrap: "wrap",
        //justifyContent: "space-evenly",
      }}
    >
      {mapButtons()}
    </div>
  );
});

const swipeConfig = {
  delta: 10, // min distance(px) before a swipe starts. *See Notes*
  preventDefaultTouchmoveEvent: false, // call e.preventDefault *See Details*
  trackTouch: true, // track touch input
  trackMouse: false, // track mouse input
  rotationAngle: 0, // set a rotation angle
};

const Annotinder = React.memo(({ options, callback, preview }) => {
  const eventsBlocked = useSelector((state) => state.eventsBlocked);
  const left = options.find((option) => option.swipe === "left");
  const up = options.find((option) => option.swipe === "up");
  const right = options.find((option) => option.swipe === "right");

  // set useSwipeable on document (https://github.com/FormidableLabs/react-swipeable/issues/180#issuecomment-649677983)
  const { ref } = useSwipeable({
    onSwipeStart: (eventData) => {
      if (eventData && eventData.first) {
        console.log(eventData);
        if (eventData.dir === "Right") callback(right);
        if (eventData.dir === "Up") callback(up);
        if (eventData.dir === "Left") callback(left);
      }
    },
    ...swipeConfig,
  });
  useEffect(() => ref(document));

  const onKeydown = React.useCallback(
    (event) => {
      // any arrowkey
      if (arrowKeys.includes(event.key)) {
        event.preventDefault();
        if (event.key === "ArrowRight") callback(right);
        if (event.key === "ArrowUp") callback(up);
        if (event.key === "ArrowLeft") callback(left);
      }
    },

    [callback, left, right, up]
  );

  useEffect(() => {
    if (!eventsBlocked && !preview) {
      window.addEventListener("keydown", onKeydown);
    } else window.removeEventListener("keydown", onKeydown);

    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, [onKeydown, eventsBlocked, preview]);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignContent: "stretch",

        height: "100%",
      }}
    >
      <Button
        fluid
        disabled={up == null}
        onClick={(e, d) => callback(up)}
        style={{
          flex: "1 1 auto",
          background: up?.color || "white",
        }}
      >
        <div style={{ color: "black", fontWeight: "bold", fontSize: "1em" }}>
          <Icon name={up?.code ? "arrow up" : null} />
          <span>{up?.code || ""}</span>
        </div>
      </Button>
      <div style={{ flex: "1 1 auto" }}>
        <div
          style={{
            display: "flex",
            height: "100%",
            flexWrap: "wrap",
            alignContent: "stretch",
          }}
        >
          <Button
            disabled={left == null}
            onClick={(e, d) => callback(left)}
            style={{
              flex: "1 1 auto",
              width: "45%",
              background: left?.color || "white",
            }}
          >
            <div style={{ color: "black", fontWeight: "bold", fontSize: "1em" }}>
              <Icon name={left?.code ? "arrow left" : null} />
              <span>{left?.code || ""}</span>
            </div>
          </Button>
          <Button
            disabled={right == null}
            onClick={(e, d) => callback(right)}
            style={{
              flex: "1 1 auto",
              width: "45%",
              background: right?.color || "white",
            }}
          >
            <div style={{ color: "black", fontWeight: "bold", fontSize: "1em" }}>
              <span>{right?.code || ""}</span>
              <Icon name={right?.code ? "arrow right" : null} />
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
});

export default QuestionForm;

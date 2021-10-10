import React, { useState, useEffect, useRef } from "react";
import { Grid } from "semantic-ui-react";
import QuestionForm from "./QuestionForm";
import Document from "components/Tokens/Document";
import useItemBundle from "hooks/useItemBundle";
import { useSelector } from "react-redux";
import { useSwipeable } from "react-swipeable";
import { codeBookEdgesToMap, getCodeTreeArray } from "util/codebook";

const documentSettings = {
  textUnitPosition: 2 / 4,
  showAnnotations: false,
  centerVertical: true,
  canAnnotate: false,
};

const QuestionTask = ({ item, codebook, preview = false }) => {
  //const [menuHeight, setMenuHeight] = useState(50);
  const questionIndex = useSelector(state => state.questionIndex);
  const [questions, setQuestions] = useState(null);
  const itemBundle = useItemBundle(item, codebook, documentSettings, preview);
  const refs = { text: useRef(), box: useRef() };
  const [textReady, setTextReady] = useState(0);

  useEffect(() => {
    setQuestions(prepareQuestions(codebook));
  }, [codebook]);

  useEffect(() => {
    if (!refs?.text.current) return null;
    refs.box.current.style.backgroundColor = "white";
    refs.text.current.style.transition = ``;
    refs.box.current.style.transition = ``;
    refs.box.current.style.opacity = 0;
    refs.text.current.style.transform = "translateX(0%) translateY(0%)";
  }, [refs.text, refs.box, item]);

  useEffect(() => {
    if (!refs?.text.current) return null;
    refs.box.current.style.transition = `opacity 200ms ease-out`;
    refs.box.current.style.opacity = 1;
  }, [textReady, refs.text, refs.box]);

  // swipe controlls need to be up here due to working on the div wrapping the while question screen
  const [swipe, setSwipe] = useState(null);
  const leftrightSwipe = useSwipeable(
    swipeControlLeftright(questions?.[questionIndex], refs, setSwipe)
  );
  //const upSwipe = useSwipeable(swipeControl(questions?.[questionIndex], swipeAnimationRefs.up));

  if (!itemBundle) return null;
  let splitHeight = 50;

  if (codebook.questions[questionIndex].type === "annotinder") {
    splitHeight = 70;
  }

  return (
    <div {...leftrightSwipe} style={{ height: "100%" }}>
      <Grid
        style={{
          height: "100%",
        }}
      >
        <Grid.Column style={{ padding: "0", height: "100%" }}>
          <Grid.Row style={{ border: "1px solid", height: `${splitHeight}%` }}>
            <div ref={refs.box} style={{ height: "100%", overflow: "hidden" }}>
              <div
                ref={refs.text}
                style={{
                  border: "1px solid",
                  height: "100%",
                  backgroundColor: "white",
                  overflow: "hidden",
                }}
              >
                <Document itemBundle={itemBundle} setReady={setTextReady} />
              </div>
            </div>
          </Grid.Row>
          <Grid.Row style={{ height: `${100 - splitHeight}%` }}>
            <div style={{ height: "100%" }}>
              <QuestionForm
                itemBundle={itemBundle}
                questions={questions}
                questionIndex={questionIndex}
                preview={preview}
                swipe={swipe}
              />
            </div>
          </Grid.Row>
        </Grid.Column>
      </Grid>
    </div>
  );
};

const prepareQuestions = codebook => {
  const questions = codebook.questions;
  return questions.map(question => {
    const codeMap = codeBookEdgesToMap(question.codes);
    const cta = getCodeTreeArray(codeMap);
    const [options, swipeOptions] = getOptions(cta);
    return { ...question, options, swipeOptions }; // note that it's important that this deep copies question
  });
};

const getOptions = cta => {
  const options = [];
  const swipeOptions = {}; // object, for fast lookup in swipeControl

  for (let code of cta) {
    if (!code.active) return options;
    if (!code.activeParent) return options;
    let tree = code.tree.join(" - ");
    //if (tree === "") tree = "Root";
    const option = {
      //ref: React.createRef(),
      code: code.code,
      tree: tree,
      color: code.color,
    };
    if (code.swipe) swipeOptions[code.swipe] = option;
    options.push(option);
  }
  return [options, swipeOptions];
};

const swipeControlLeftright = (question, refs, setSwipe, triggerdist = 100) => {
  if (!question) return {};
  if (question.type !== "annotinder") return {};
  const transitionTime = 200;
  // const blockSwipe = useRef()

  const swipeConfig = {
    delta: 10, // min distance(px) before a swipe starts. *See Notes*
    preventDefaultTouchmoveEvent: false, // call e.preventDefault *See Details*
    trackTouch: true, // track touch input
    trackMouse: false, // track mouse input
    rotationAngle: 0, // set a rotation angle
  };

  return {
    onSwiping: d => {
      if (d.deltaX !== 0) {
        refs.text.current.style.transition = ``;
        refs.text.current.style.transform = `translateX(${d.deltaX}px)`;
        refs.box.current.style.backgroundColor =
          d.deltaX > 0 ? question.swipeOptions.right.color : question.swipeOptions.left.color;
        refs.box.current.text = "Test";
      }
    },
    onSwiped: d => {
      refs.text.current.style.transition = `transform ${transitionTime}ms ease-out, opacity ${transitionTime}ms ease-out, opacity ${transitionTime}ms ease-out`;

      if (Math.abs(d.deltaX) < triggerdist) {
        refs.text.current.style.transform = `translateX(0%)`;
        refs.box.current.style.backgroundColor = "white";
      } else {
        refs.text.current.style.transform = `translateX(${d.deltaX > 0 ? 100 : -100}%)`;
        refs.box.current.style.transition = `opacity ${transitionTime}ms ease-out`;
        refs.box.current.style.opacity = 0;

        setSwipe(d.deltaX > 0 ? "right" : "left");
        setSwipe(null);
      }
    },
    ...swipeConfig,
  };
};

export default React.memo(QuestionTask);

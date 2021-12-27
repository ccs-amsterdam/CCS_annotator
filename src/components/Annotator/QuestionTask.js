import React, { useState, useEffect, useRef } from "react";
import QuestionForm from "./subcomponents/QuestionForm";
import Document from "components/Document/Document";
import { useSwipeable } from "react-swipeable";
import { codeBookEdgesToMap, getCodeTreeArray } from "library/codebook";
import { Form, Icon, Input, Popup } from "semantic-ui-react";
import { useCookies } from "react-cookie";

const documentSettings = {
  centerVertical: true,
};

const QuestionTask = ({ unit, codebook, setUnitIndex, blockEvents, fullScreenNode }) => {
  console.log(fullScreenNode);
  const [tokens, setTokens] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState(null);
  const refs = { text: useRef(), box: useRef(), code: useRef() };
  const [textReady, setTextReady] = useState(0);
  const [cookies, setCookie] = useCookies(["questionTaskSettings"]);
  const [settings, setSettings] = useState(
    cookies.questionTaskSettings || { splitHeight: 60, textSize: 1 }
  );
  const divref = useRef(null);

  useEffect(() => {
    setCookie("questionTaskSettings", JSON.stringify(settings), { path: "/" });
  }, [settings, setCookie]);

  useEffect(() => {
    if (!codebook?.questions) return;
    setQuestions(prepareQuestions(codebook));
  }, [codebook]);

  useEffect(() => {
    if (!refs?.text.current) return null;
    refs.box.current.style.backgroundColor = "white";
    refs.text.current.style.transition = ``;
    refs.box.current.style.transition = ``;
    refs.box.current.style.opacity = 0;
    refs.text.current.style.transform = "translateX(0%) translateY(0%)";
  }, [refs.text, refs.box, unit, questionIndex]);

  useEffect(() => {
    if (!refs?.text.current) return null;
    refs.box.current.style.transition = `opacity 200ms ease-out`;
    refs.box.current.style.opacity = 1;
  }, [textReady, refs.text, refs.box, questionIndex]);

  // swipe controlls need to be up here due to working on the div wrapping the while question screen
  // use separate swipe for text (document) and menu rows, to disable swiping up
  // in text (which conflicts with scrolling)
  const [swipe, setSwipe] = useState(null);
  const textSwipe = useSwipeable(swipeControl(questions?.[questionIndex], refs, setSwipe, false));
  const menuSwipe = useSwipeable(swipeControl(questions?.[questionIndex], refs, setSwipe, true));

  if (!unit) return null;

  return (
    <div ref={divref} style={{ height: "100%" }}>
      <div
        {...textSwipe}
        style={{
          position: "relative",
          border: "1px solid",
          height: `${settings.splitHeight}%`,
        }}
      >
        <div
          ref={refs.box}
          style={{
            height: "100%",
            width: "100%",
            overflow: "hidden",
            position: "absolute",
          }}
        >
          {/* This div moves around behind the div containing the document to show the swipe code  */}
          <div
            ref={refs.code}
            style={{ padding: "0.6em 0.3em", width: "100%", fontSize: "3em", position: "absolute" }}
          />
          <div
            ref={refs.text}
            style={{
              border: "1px solid",
              height: "100%",
              width: "100%",
              position: "absolute",
              top: "0",
              backgroundColor: "white",
              overflow: "hidden",
              fontSize: `${settings.textSize}em`,
            }}
          >
            <Document
              unit={unit}
              settings={documentSettings}
              setReady={setTextReady}
              returnTokens={setTokens}
              fullScreenNode={fullScreenNode}
            />
          </div>
        </div>
        <SettingsPopup settings={settings} setSettings={setSettings} fullScreenNode={fullScreenNode}/>
      </div>
      <div {...menuSwipe} style={{ height: `${100 - settings.splitHeight}%` }}>
        <QuestionForm
          unit={unit}
          tokens={tokens}
          questions={questions}
          questionIndex={questionIndex}
          setQuestionIndex={setQuestionIndex}
          setUnitIndex={setUnitIndex}
          swipe={swipe}
          blockEvents={blockEvents}
        />
      </div>
    </div>
  );
};

const SettingsPopup = ({ settings, setSettings, fullScreenNode }) => {
  return (
    <Popup
      on="click"
      mountNode={fullScreenNode || undefined}
      trigger={
        <Icon
          size="large"
          name="setting"
          style={{
            position: "absolute",

            cursor: "pointer",
            top: "1px",
            left: "-1px",
            color: "#1b1c1d",
            padding: "5px 0px",
            height: "30px",
          }}
        />
      }
    >
      <Form>
        <Form.Group grouped>
          <Form.Field>
            <label>
              text window size <font style={{ color: "blue" }}>{`${settings.splitHeight}%`}</font>
            </label>
            <Input
              size="mini"
              step={2}
              min={20}
              max={80}
              type="range"
              value={settings.splitHeight}
              onChange={(e, d) => setSettings((state) => ({ ...state, splitHeight: d.value }))}
            />
          </Form.Field>
          <Form.Field>
            <label>
              text size scaling <font style={{ color: "blue" }}>{`${settings.textSize}`}</font>
            </label>
            <Input
              size="mini"
              step={0.025}
              min={0.4}
              max={1.6}
              type="range"
              value={settings.textSize}
              onChange={(e, d) => setSettings((state) => ({ ...state, textSize: d.value }))}
            />
          </Form.Field>
        </Form.Group>
      </Form>
    </Popup>
  );
};

const prepareQuestions = (codebook) => {
  const questions = codebook.questions;
  return questions.map((question) => {
    const codeMap = codeBookEdgesToMap(question.codes);
    let cta = getCodeTreeArray(codeMap);
    cta = addRequiredFor([...cta]);
    const [options, swipeOptions] = getOptions(cta);
    return { ...question, options, swipeOptions }; // it's important that this deep copies question
  });
};

const addRequiredFor = (cta) => {
  // if codebook has a required_for question, check if this code has it. If not, it's the same as this code having
  // a makes_irrelevant for this question. This way we only need to process the makes_irrelevant logic (which is easier)
  const haveRequired = cta.reduce((s, code) => {
    if (!code.required_for) return s;
    if (typeof code.required_for !== "object") {
      s.add(code.required_for);
    } else {
      for (let rf of code.required_for) s.add(rf);
    }
    return s;
  }, new Set());

  for (let code of cta) {
    for (let hasReq of haveRequired) {
      if (
        !code.required_for ||
        (code.required_for !== hasReq && !code.required_for.includes(hasReq))
      ) {
        if (!code.makes_irrelevant.includes(hasReq))
          code.makes_irrelevant = [...code.makes_irrelevant, hasReq];
      }
    }
  }
  return cta;
};

const getOptions = (cta) => {
  const options = [];
  const swipeOptions = {}; // object, for fast lookup in swipeControl

  for (let code of cta) {
    if (!code.active) continue;
    if (!code.activeParent) continue;
    let tree = code.tree.join(" - ");
    const option = {
      code: code.code,
      tree: tree,
      makes_irrelevant: code.makes_irrelevant,
      color: code.color,
    };
    if (code.swipe) swipeOptions[code.swipe] = option;
    options.push(option);
  }
  return [options, swipeOptions];
};

const swipeControl = (question, refs, setSwipe, alwaysDoVertical, triggerdist = 150) => {
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

  const getDeltas = (d) => {
    let deltaX = d.deltaX;
    let deltaY = d.deltaY;
    if (Math.abs(deltaX) > Math.abs(deltaY) + 10) deltaY = 0;
    if (Math.abs(deltaX) < Math.abs(deltaY) + 10) deltaX = 0;
    if (!alwaysDoVertical) {
      // the bottom menu always allows vertical upward swipe, but for the
      // text div we only allow swiping up if scrolled all the way to bottom

      // get the tokensContainer
      const el = refs.text.current.getElementsByClassName("TokensContainer")[0];
      const bottom = el.scrollHeight - Math.ceil(el.scrollTop) === el.clientHeight;
      if (!bottom) deltaY = 0;
    }
    return [deltaX, deltaY];
  };

  return {
    onSwiping: (d) => {
      const [deltaX, deltaY] = getDeltas(d);
      if (deltaX > 0 && !question.swipeOptions.right) return;
      if (deltaX < 0 && !question.swipeOptions.left) return;
      if (deltaY < 0 && !question.swipeOptions.up) return;
      if (deltaY !== 0 && deltaY > 0) return;

      refs.text.current.style.transition = ``;
      refs.text.current.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px)`;

      let bgc = question.swipeOptions.up?.color;
      let code = question.swipeOptions.up?.code;
      let [bottom, talign] = ["0%", "center"];
      if (deltaX > 0) {
        bgc = question.swipeOptions.right?.color;
        code = question.swipeOptions.right?.code;
        [bottom, talign] = ["40%", "left"];
      }
      if (deltaX < 0) {
        bgc = question.swipeOptions.left?.color;
        code = question.swipeOptions.left?.code;
        [bottom, talign] = ["40%", "right"];
      }

      refs.box.current.style.backgroundColor = bgc;
      refs.code.current.innerText = code;
      refs.code.current.style.bottom = bottom;
      refs.code.current.style.textAlign = talign;
    },
    onSwiped: (d) => {
      const [deltaX, deltaY] = getDeltas(d);
      if (deltaX > 0 && !question.swipeOptions.right) return;
      if (deltaX < 0 && !question.swipeOptions.left) return;
      if (deltaY < 0 && !question.swipeOptions.up) return;
      if (deltaY !== 0 && deltaY > 0) return;

      refs.text.current.style.transition = `transform ${transitionTime}ms ease-out, opacity ${transitionTime}ms ease-out`;

      if (Math.abs(deltaX) < triggerdist && Math.abs(deltaY) < triggerdist) {
        refs.text.current.style.transform = `translateX(0%) translateY(0%)`;
        //refs.box.current.style.backgroundColor = "white";
      } else {
        refs.text.current.style.transform = `translateX(${
          deltaX > 0 ? 100 : deltaX < 0 ? -100 : 0
        }%) translateY(${deltaY > 0 ? 100 : -100}%)`;
        refs.box.current.style.transition = `opacity ${transitionTime}ms ease-out`;
        refs.box.current.style.opacity = 0;

        let dir = "up";
        dir = deltaX > 0 ? "right" : "left";
        setSwipe(dir);
        setSwipe(null);
      }
    },
    ...swipeConfig,
  };
};

export default React.memo(QuestionTask);

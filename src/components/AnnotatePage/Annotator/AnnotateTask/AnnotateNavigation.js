import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  toggleTokenSelection,
  setCurrentToken,
  clearTokenSelection,
  triggerCodeselector,
} from "actions";
import { toggleSpanAnnotations } from "actions";
import { keepInView } from "util/scroll";

// This component generates no content, but manages navigation for span level annotations

const arrowkeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const AnnotateNavigation = ({ tokens, selectedCode }) => {
  const eventsBlocked = useSelector((state) => state.eventsBlocked);
  // positions based on token.arrayIndex, not token.index
  // arrayIndex is the actual tokens array, where token.index is the position of the token in the document
  // (these can be different if the text/context does not start at token.index 0)
  const currentToken = useSelector((state) => state.currentToken);
  const tokenSelection = useSelector((state) => state.tokenSelection); // selection based on token.arrayIndex (not token.index)

  const [mover, setMover] = useState(null);
  const [HoldSpace, setHoldSpace] = useState(false);
  const [holdArrow, setHoldArrow] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    if (eventsBlocked) {
      setHoldArrow(false);
      setHoldSpace(false);
    }
  }, [setHoldArrow, setHoldSpace, eventsBlocked]);

  useEffect(() => {
    // When arrow key is held, walk through tokens with increasing speed
    // this loops itself by updating mover (an object with position information)
    // this is like setIntervall, but allows custom time intervalls,
    if (!mover || !holdArrow) return;

    let position = movePosition(tokens, holdArrow, mover, HoldSpace, dispatch);

    let delay = Math.max(5, 100 / Math.ceil(mover.counter / 5));
    if (mover.counter === 1) delay = 150;
    setTimeout(() => {
      setMover({
        position: position,
        startposition: mover.startposition,
        ntokens: mover.ntokens,
        counter: mover.counter + 1,
      });
    }, delay);
  }, [tokens, mover, holdArrow, HoldSpace, dispatch]);

  if (!tokens) return null;

  // this prevents rendering the components that manage the key and mouse events
  if (eventsBlocked) return null;

  return (
    <>
      <KeyEvents
        tokenSelection={tokenSelection}
        currentToken={currentToken}
        tokens={tokens}
        HoldSpace={HoldSpace}
        setMover={setMover}
        setHoldSpace={setHoldSpace}
        setHoldArrow={setHoldArrow}
        selectedCode={selectedCode}
      />
      <MouseEvents tokenSelection={tokenSelection} tokens={tokens} selectedCode={selectedCode} />
    </>
  );
};

const KeyEvents = ({
  tokenSelection,
  currentToken,
  tokens,
  HoldSpace,
  setMover,
  setHoldSpace,
  setHoldArrow,
  selectedCode,
}) => {
  const dispatch = useDispatch();

  // This blocks event listeners when the eventsBlocked state (in redux) is true.
  // This lets us block the key activities in the text (selecting tokens) when
  // the CodeSelector popup is open
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  // (see useEffect with 'eventsBlocked' for details on useCallback)
  const onKeyUp = (event) => {
    // keep track of which buttons are pressed in the state
    if (event.keyCode === 32 && HoldSpace) {
      setHoldSpace(false);
      if (tokenSelection.length > 0)
        annotationFromSelection(tokens, tokenSelection, dispatch, selectedCode);
      return;
    }
    if (arrowkeys.includes(event.key)) {
      setHoldArrow(false);
      setMover(null);
    }
  };

  // (see useEffect with 'eventsBlocked' for details on useCallback)
  const onKeyDown = (event) => {
    // key presses, and key holding (see onKeyUp)
    if (event.keyCode === 32) {
      event.preventDefault();
      if (event.repeat) return;
      setHoldSpace(true);
      return;
    }
    if (arrowkeys.includes(event.key)) {
      event.preventDefault();
      if (event.repeat) return;
      setMover({
        position: currentToken,
        startposition: currentToken,
        ntokens: tokens.length,
        counter: 1,
      });
      setHoldArrow(event.key);
    }

    if (tokenSelection.length > 0) {
      if (tokenSelection[0] === tokenSelection[1]) {
        // enter key
        if (event.keyCode === 13) {
          dispatch(triggerCodeselector("enter_key", tokens[tokenSelection[0]].index, null));
        }
      }
    }
  };

  return <></>;
};

const MouseEvents = ({ tokenSelection, tokens, selectedCode }) => {
  const [holdMouseLeft, setHoldMouseLeft] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  });

  const onMouseDown = (event) => {
    // When left button pressed, start new selection
    if (event.which === 1) {
      //event.preventDefault();
      setHoldMouseLeft(true);
      dispatch(clearTokenSelection());
    }
  };

  const onMouseMove = (event) => {
    // When selection started (mousedown), select tokens hovered over
    if (holdMouseLeft) {
      if (event.which !== 1) return null;
      window.getSelection().empty();
      storeMouseSelection(event);
    } else {
      let currentNode = getToken(tokens, event);
      if (currentNode !== null) {
        dispatch(setCurrentToken(currentNode));
        dispatch(toggleTokenSelection(tokens, currentNode, false));
      }
    }
  };

  const onMouseUp = (event) => {
    // When left mouse key is released, create the annotation
    // note that in case of a single click, the token has not been selected (this happens on move)
    // so this way a click can still be used to open
    if (event.which !== 1) return null;
    const currentNode = storeMouseSelection(event);
    window.getSelection().empty();
    setHoldMouseLeft(false);

    if (currentNode === null) return null;

    // storeMouseSelection does save position to tokenSelection state, but this isn't
    // yet updated within this scope. This results in single clicks (without mousemove)
    // not registering. So if there is no current selection, directly use currentNode as position.
    if (tokenSelection.length > 0) {
      annotationFromSelection(tokens, tokenSelection, dispatch, selectedCode);
    } else {
      if (currentNode !== null) {
        annotationFromSelection(tokens, [currentNode, currentNode], dispatch, selectedCode);
      }
    }
  };

  const onContextMenu = (event) => {
    if (event.button === 2) return null;
    event.preventDefault();
    event.stopPropagation();
  };

  const storeMouseSelection = (event) => {
    // select tokens that the mouse/touch is currently pointing at
    let currentNode = getToken(tokens, event);
    if (currentNode == null || currentNode === null) return null;

    dispatch(setCurrentToken(currentNode));
    dispatch(toggleTokenSelection(tokens, currentNode, true));
    return currentNode;
  };

  return <></>;
};

const annotationFromSelection = (tokens, selection, dispatch, selectedCode) => {
  let [from, to] = selection;
  if (from > to) [from, to] = [to, from];

  const annotations = [];
  let lastSection = tokens[from].section;
  for (let i = from; i <= to; i++) {
    if (tokens[i].section !== lastSection) {
      from = i;
      lastSection = tokens[i].section;
    }
    annotations.push({
      index: tokens[i].index, // note that i is not token.index, but the tokens arrayIndex
      group: selectedCode == null ? "UNASSIGNED" : selectedCode,
      length: tokens[to].length + tokens[to].offset - tokens[from].offset,
      span: [tokens[from].index, tokens[to].index],
      section: tokens[i].section,
      offset: tokens[from].offset,
    });
  }

  dispatch(toggleSpanAnnotations(annotations));
  dispatch(clearTokenSelection());
  if (selectedCode == null) {
    dispatch(triggerCodeselector(null, null, null));
    dispatch(triggerCodeselector("new_selection", tokens[to].index, null));
  }
};

const movePosition = (tokens, key, mover, space, dispatch) => {
  let newPosition = mover.position;
  if (key === "ArrowRight") newPosition++;
  if (key === "ArrowLeft") newPosition--;
  if (key === "ArrowUp") newPosition = moveSentence(tokens, mover, "up");
  if (key === "ArrowDown") newPosition = moveSentence(tokens, mover, "down");

  if (newPosition > mover.ntokens) newPosition = mover.ntokens;
  if (newPosition < 0) newPosition = 0;

  if (tokens[newPosition]?.ref == null) {
    if (key === "ArrowRight") {
      const firstUnit = tokens.findIndex((token) => token.textPart === "textUnit");
      if (firstUnit < 0) return mover.position;
      newPosition = firstUnit;
    }
    if (key === "ArrowLeft") {
      const firstAfterUnit = tokens.findIndex((token) => token.textPart === "contextAfter");
      if (firstAfterUnit < 0) return mover.position;
      newPosition = firstAfterUnit - 1;
    }
  }

  if (space) {
    // limit selection to current section
    if (tokens[mover.position].section !== tokens[newPosition].section) {
      if (newPosition > mover.position) {
        for (let i = newPosition; i >= mover.position; i--)
          if (tokens[i].section === tokens[mover.position].section) {
            newPosition = i;
            break;
          }
      } else {
        for (let i = newPosition; i <= mover.position; i++) {
          if (tokens[i].section === tokens[mover.position].section) {
            newPosition = i;
            break;
          }
        }
      }
    }
  }

  if (mover.position !== newPosition) {
    dispatch(setCurrentToken(newPosition));
    dispatch(toggleTokenSelection(tokens, newPosition, space));

    scrollTokenToMiddle(tokens[newPosition].ref.current);

    // const down = key === "ArrowRight" || key === "ArrowDown";
    // tokens[newPosition].ref.current.scrollIntoView(false, {
    //   block: down ? "start" : "end",
    // });
  }
  return newPosition;
};

const moveSentence = (tokens, mover, direction = "up") => {
  // moving sentences is a bit tricky, but we can do it via the refs to the
  // token spans, that provide information about the x and y values

  if (tokens[mover.position]?.ref == null || tokens[mover.startposition]?.ref == null) {
    const firstUnit = tokens.findIndex((token) => token.textPart === "textUnit");
    return firstUnit < 0 ? 0 : firstUnit;
  }

  const current = tokens[mover.position].ref.current.getBoundingClientRect();
  const start = tokens[mover.startposition].ref.current.getBoundingClientRect();
  let next;

  if (direction === "up") {
    for (let i = mover.position; i >= 0; i--) {
      if (tokens[i].ref == null) {
        const firstUnit = tokens.findIndex((token) => token.textPart === "textUnit");
        return firstUnit < 0 ? 0 : firstUnit;
      }
      next = tokens[i].ref.current.getBoundingClientRect();
      if (next.y < current.y && next.x <= start.x) {
        return i;
      }
    }
    return 0;
  }
  if (direction === "down") {
    let nextsent = null;
    for (let i = mover.position; i < tokens.length; i++) {
      if (tokens[i].ref == null) {
        const firstAfterUnit = tokens.findIndex((token) => token.textPart === "contextAfter");
        return firstAfterUnit < 0 ? tokens.length - 1 : firstAfterUnit - 1;
      }
      next = tokens[i].ref.current.getBoundingClientRect();

      if (!nextsent && next.y > current.y) nextsent = next.y;
      if (nextsent && next.y > nextsent) return i - 1;
      if (next.y > current.y && next.x >= start.x) return i;
    }
    return tokens.length - 1;
  }
};

const getTokenAttributes = (tokens, tokenNode) => {
  return parseInt(tokenNode.getAttribute("tokenindex"));
  // const tokenArrayIndex = tokenindex - tokens[0].index;

  // return {
  //   index: tokenindex,
  //   tokenArrayIndex: tokenArrayIndex,
  //   offset: tokens[tokenArrayIndex].offset,
  //   length: tokens[tokenArrayIndex].length,
  // };
};

const getToken = (tokens, e) => {
  try {
    // sometimes e is Restricted, and I have no clue why,
    // nor how to check this in a condition. hence the try clause
    e = e.originalTarget || e.path[0];
    if (e) {
      if (
        e.className === "token" ||
        e.className === "token selected" ||
        e.className === "token selected highlight" ||
        e.className === "token highlight"
      ) {
        return getTokenAttributes(tokens, e);
      }
      if (e.parentNode) {
        if (
          e.parentNode.className === "token" ||
          e.parentNode.className === "token selected" ||
          e.parentNode.className === "token selected highlight" ||
          e.parentNode.className === "token highlight"
        )
          return getTokenAttributes(tokens, e.parentNode);
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

function scrollTokenToMiddle(token) {
  // token->sentence->paragraph->section->textpart->box
  // this should be stable, but it still looks terrible
  const parentDiv = token.parentNode.parentNode.parentNode.parentNode.parentNode;
  keepInView(parentDiv, token);
}

export default AnnotateNavigation;

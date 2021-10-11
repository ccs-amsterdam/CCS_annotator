import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  toggleTokenSelection,
  setCurrentToken,
  clearTokenSelection,
  triggerCodeselector,
} from "actions";
import { keepInView } from "util/scroll";
import { moveUp, moveDown } from "util/refNavigation";

// This component generates no content, but manages navigation for span level annotations

const arrowkeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const AnnotateNavigation = ({ tokens }) => {
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
      />
      <MouseEvents tokenSelection={tokenSelection} tokens={tokens} />
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
      if (tokenSelection.length > 0) {
        const code = tokenSelection[0] === tokenSelection[1] ? null : "UNASSIGNED";
        annotationFromSelection(tokens, tokenSelection, dispatch, code);
      }
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
          console.log("whaaat");
          dispatch(triggerCodeselector(tokens[tokenSelection[0]].index, null, null));
        }
      }
    }
  };

  return <></>;
};

const MouseEvents = ({ tokenSelection, tokens }) => {
  const selectionStarted = useRef(false);
  const tapped = useRef(null);
  const istouch = useRef(
    "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0
  ); // hack to notice if device uses touch (because single touch somehow triggers mouseup)
  const dispatch = useDispatch();

  useEffect(() => {
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchstart", onTouchDown);
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchstart", onTouchDown);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  });

  const onTouchDown = (event) => {
    const token = getToken(tokens, event);
    if (token?.index === null) {
      tapped.current = null;
      dispatch(clearTokenSelection());
      return;
    }

    // first check if there is a tokenselection (after double tab). If so, this completes the selection
    if (tokenSelection.length > 0 && tokenSelection[0] === tapped.current) {
      // if a single token, and an annotation already exists, open create/edit mode
      const currentNode = storeMouseSelection(event);
      dispatch(toggleTokenSelection(tokens, currentNode, true));

      if (token?.annotated && currentNode === tokenSelection[0]) {
        annotationFromSelection(tokens, [currentNode, currentNode], dispatch, null);
      } else {
        annotationFromSelection(tokens, [tokenSelection[0], currentNode], dispatch, "UNASSIGNED");
      }
      tapped.current = null;
      return;
    }

    // otherwise, handle the double tab (on the same token) for starting the selection
    if (tapped.current !== token.index) {
      tapped.current = token.index;
      dispatch(clearTokenSelection());
    } else {
      dispatch(toggleTokenSelection(tokens, token.index, false));
    }
  };

  const onMouseDown = (event) => {
    if (istouch.current) return; // suppress mousedown triggered by quick tap
    // When left button pressed, start new selection
    if (event.which === 1) {
      selectionStarted.current = true;
      dispatch(clearTokenSelection());
    }
  };

  const onMouseMove = (event) => {
    if (istouch.current) return;
    // When selection started (mousedown), select tokens hovered over
    if (selectionStarted.current) {
      event.preventDefault();
      if (event.which !== 1 && event.which !== 0) return null;

      window.getSelection().empty();
      storeMouseSelection(event);
    } else {
      let currentNode = getToken(tokens, event);
      if (currentNode.index !== null) {
        dispatch(setCurrentToken(currentNode.index));
        dispatch(toggleTokenSelection(tokens, currentNode.index, false));
      }
    }
  };

  const onMouseUp = (event) => {
    if (istouch.current) return;
    // When left mouse key is released, create the annotation
    // note that in case of a single click, the token has not been selected (this happens on move)
    // so this way a click can still be used to open
    if (event.which !== 1 && event.which !== 0) return null;
    const currentNode = storeMouseSelection(event);
    window.getSelection().empty();
    //setHoldMouseLeft(false);
    selectionStarted.current = false;

    // this worked before, but is not possible due to touchend not registering position
    //if (currentNode === null) return null;

    // storeMouseSelection does save position to tokenSelection state, but this isn't
    // yet updated within this scope. This results in single clicks (without mousemove)
    // not registering. So if there is no current selection, directly use currentNode as position.
    if (tokenSelection.length > 0 && tokenSelection[0] !== null && tokenSelection[1] !== null) {
      annotationFromSelection(tokens, tokenSelection, dispatch, "UNASSIGNED");
    } else {
      if (currentNode !== null) {
        annotationFromSelection(tokens, [currentNode, currentNode], dispatch, null);
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
    //if (currentNode == null || currentNode === null) return null;

    dispatch(setCurrentToken(currentNode.index));
    dispatch(toggleTokenSelection(tokens, currentNode.index, true));
    return currentNode.index;
  };

  return <></>;
};

const annotationFromSelection = (tokens, selection, dispatch, code) => {
  let [from, to] = selection;
  if (from > to) [from, to] = [to, from];

  const annotation = {
    index: tokens[from].index,
    length: tokens[to].length + tokens[to].offset - tokens[from].offset,
    span: [tokens[from].index, tokens[to].index],
    section: tokens[from].section,
    offset: tokens[from].offset,
  };

  dispatch(triggerCodeselector(tokens[to].index, code, annotation));
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
      const firstUnit = tokens.findIndex((token) => token.codingUnit);
      if (firstUnit < 0) return mover.position;
      newPosition = firstUnit;
    }
    if (key === "ArrowLeft") {
      const firstAfterUnit = tokens.lastIndexOf((token) => token.codingUnit);
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
    const firstUnit = tokens.findIndex((token) => token.codingUnit);
    return firstUnit < 0 ? 0 : firstUnit;
  }

  if (direction === "up") {
    return moveUp(tokens, mover.position);
  }
  if (direction === "down") {
    return moveDown(tokens, mover.position);
  }
};

const getToken = (tokens, e) => {
  const [n, annotated] = getNode(tokens, e);
  if (n === null) return { index: null, annotated: false };
  return { index: getTokenAttributes(tokens, n), annotated };
};

const getNode = (tokens, e) => {
  try {
    // sometimes e is Restricted, and I have no clue why,
    // nor how to check this in a condition. hence the try clause
    let n;
    if (e.type === "mousemove" || e.type === "mouseup") n = e.originalTarget || e.path[0];
    if (e.type === "touchmove" || e.type === "touchstart") {
      // stupid hack since someone decided touchmove target is always the starting target (weirdly inconsistent with mousemove)
      // also, this still doesn't work for touchend, which is just arrrggg
      let position = e.touches[0];
      n = document.elementFromPoint(position.clientX, position.clientY);
    }

    if (n) {
      if (n.className.includes("token")) {
        return [n, false];
      }
      if (n.parentNode) {
        if (n.parentNode.className.includes("token")) return [n.parentNode, true];
      }
    }
    return [null, false];
  } catch (e) {
    return [null, false];
  }
};

const getTokenAttributes = (tokens, tokenNode) => {
  return parseInt(tokenNode.getAttribute("tokenindex"));
};

function scrollTokenToMiddle(token) {
  // token->sentence->paragraph->paragraphFlexBox->section->textpart->box
  // this should be stable, but it still looks terrible
  const parentDiv = token.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
  keepInView(parentDiv, token);
}

export default AnnotateNavigation;

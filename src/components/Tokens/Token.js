import React from "react";
import { useDispatch, useSelector } from "react-redux";

import "components/style.css";
import CodeSelector from "./CodeSelector";
import { triggerCodeselector } from "actions";
import { getColor, getColorGradient } from "util/tokenDesign";
import { List, Popup } from "semantic-ui-react";

const Token = React.forwardRef(({ token, itemBundle }, ref) => {
  const codebook = itemBundle.codebook;
  const settings = itemBundle.settings;
  const annotation = itemBundle.annotation;

  const selected = useSelector((state) => {
    if (state.tokenSelection.length === 0) return false;

    let [from, to] = state.tokenSelection;
    if (to === null) return false;
    if (from > to) [to, from] = [from, to];
    return token.arrayIndex >= from && token.arrayIndex <= to;
  });

  let tokenClass = "token";

  if (token.codingUnit) {
    if (selected) tokenClass = tokenClass + " selected";
    if (codebook?.unitSelection?.highlightAnnotation && annotation && annotation.span) {
      if (token.index >= annotation.span[0] && token.index <= annotation.span[1])
        tokenClass += " highlight";
    }
  }

  return (
    <span ref={ref} className={tokenClass} tokenindex={token.arrayIndex}>
      <AnnotatedToken token={token} codebook={codebook} settings={settings} selected={selected} />
    </span>
  );
});

const AnnotatedToken = ({ token, codebook, settings, selected }) => {
  // If we specifically ask for the annotations for the current token within the
  // useSelector function, rerender is only triggered if this value has changed

  let annotations = useSelector((state) => state.annotations.span[token.index]);

  const csTrigger = useSelector((state) => {
    if (state.codeSelectorTrigger.index !== token.index) return null;
    return state.codeSelectorTrigger;
  });
  const codeMap = codebook.codeMap;
  const dispatch = useDispatch();

  // This is a trick required to render if at least something within this token's
  // annotations changed (somehow 'annotations' doesn't trigger this)
  useSelector((state) => JSON.stringify(state.annotations.span[token.index]));

  if (annotations && codeMap) {
    annotations = { ...annotations };
    for (let code of Object.keys(annotations)) {
      if (!codeMap[code]) continue;
      if (!codeMap[code] || !codeMap[code].active || !codeMap[code].activeParent)
        delete annotations[code];
    }
  }

  //
  if (!annotations && csTrigger) annotations = {};

  // if there are no annotation codes, our life is easy
  if (!settings?.showAnnotations || !annotations) return <>{token.pre + token.text + token.post}</>;

  // if this is a context token, we can also ignore the fancy stuff
  if (!token.codingUnit) return <>{token.pre + token.text + token.post}</>;

  const tokenSpan = (annotatedTokenClass, color) => {
    return (
      <span
        className={annotatedTokenClass}
        onContextMenu={(e) => {
          e.preventDefault();
          dispatch(triggerCodeselector(token.index, null, null));
        }}
        style={
          color
            ? {
                background: color,
              }
            : null
        }
      >
        {allLeft && allRight ? token.text : null}
        {allLeft && !allRight ? token.text + token.post : null}
        {allRight && !allLeft ? token.pre + token.text : null}
        {!allLeft && !allRight ? token.pre + token.text + token.post : null}
      </span>
    );
  };

  let tokenCodes = Object.keys(annotations);
  let colors = tokenCodes.map((code) => getColor(code, codeMap));
  let color = getColorGradient(colors);

  // Set specific classes for nice css to show the start/end of codes
  const allLeft = !Object.values(annotations).some((code) => code.span[0] !== code.index);
  const allRight = !Object.values(annotations).some((code) => code.span[1] !== code.index);
  const anyLeft = Object.values(annotations).some((code) => code.span[0] === code.index);
  const anyRight = Object.values(annotations).some((code) => code.span[1] === code.index);

  let annotatedTokenClass = "annotatedToken";
  if (allLeft) annotatedTokenClass = annotatedTokenClass + " allLeft";
  if (anyLeft & !allLeft) annotatedTokenClass = annotatedTokenClass + " anyLeft";
  if (allRight) annotatedTokenClass = annotatedTokenClass + " allRight";
  if (anyRight & !allRight) annotatedTokenClass = annotatedTokenClass + " anyRight";

  if (selected) {
    color = null;
    annotatedTokenClass = annotatedTokenClass + " selected";
  }

  return (
    <>
      {allLeft ? token.pre : null}

      {csTrigger ? (
        <CodeSelector
          annotations={annotations}
          codebook={codebook}
          currentCode={csTrigger.code}
          selection={csTrigger.selection}
        >
          {tokenSpan(annotatedTokenClass, color)}
        </CodeSelector>
      ) : (
        <ShowCodeOnHover codes={tokenCodes} colors={colors}>
          {tokenSpan(annotatedTokenClass, color)}
        </ShowCodeOnHover>
      )}

      {allRight ? token.post : null}
    </>
  );
};

const ShowCodeOnHover = ({ codes, colors, children }) => {
  return (
    <Popup
      trigger={children}
      mouseLeaveDelay={0} // just don't use mouse leave
      style={{ padding: "0.3em", paddingBottom: "0.5em" }}
    >
      <List>
        {codes.map((code, i) => (
          <List.Item key={i} style={{ backgroundColor: colors[i], padding: "0.3em" }}>
            {code}
          </List.Item>
        ))}
      </List>
    </Popup>
  );
};

export default React.memo(Token);

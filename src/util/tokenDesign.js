export const getColor = (annotationCode, codeMap) => {
  if (codeMap[annotationCode]) {
    const foldTo = codeMap[annotationCode].foldToParent;
    if (foldTo && codeMap[foldTo]) return codeMap[foldTo].color + "50";
    return codeMap[annotationCode].color + "50";
  } else {
    return "white";
  }
};

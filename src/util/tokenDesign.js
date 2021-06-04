export const getColor = (annotationCode, codeMap) => {
  if (codeMap[annotationCode]) {
    return codeMap[annotationCode].color + "50";
  } else {
    return "white";
  }
};

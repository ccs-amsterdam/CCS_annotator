export const getColor = (annotationCode, codeMap) => {
  if (codeMap[annotationCode]) {
    const foldTo = codeMap[annotationCode].foldToParent;
    if (foldTo && codeMap[foldTo]) return codeMap[foldTo].color + "50";
    return codeMap[annotationCode].color + "50";
  } else {
    return "white";
  }
};

export const getColorGradient = (colors) => {
  let color = null;

  if (colors.length === 1) {
    color = colors[0];
  } else {
    const pct = Math.floor(100 / colors.length);
    const gradColors = colors.reduce((a, color, i) => {
      if (i === 0) a.push(color + ` ${pct}%`);
      if (i === colors.length - 1) a.push(color + ` ${100 - pct}%`);

      if (i > 0 && i < colors.length - 1) {
        a.push(color + ` ${pct * i}%`);
        a.push(color + ` ${pct * (i + 1)}%`);
      }
      return a;
    }, []);

    color = `linear-gradient(to bottom, ${gradColors.join(", ")})`;
  }

  return color;
};

import nlp from "compromise";
import paragraphs from "compromise-paragraphs";
nlp.extend(paragraphs);

export const parseTokens = (text_fields) => {
  // map to single array.
  // for some reason there's an extra array layer between sents and pars...
  // I've only found cases where lenght is 1, but I'll map it just in case
  const tokens = [];
  let token = null;
  let paragraph = 0;
  let sentence = 0;
  let tokenIndex = 0;
  let t = null;
  let text = null;
  for (let text_field of text_fields) {
    let section = text_field.name;
    text = text_field.value;
    t = nlp.tokenize(text).paragraphs().json({ offset: true });
    for (let par = 0; par < t.length; par++) {
      for (let sent = 0; sent < t[par].sentences.length; sent++) {
        for (let sent2 = 0; sent2 < t[par].sentences[sent].length; sent2++) {
          for (let term = 0; term < t[par].sentences[sent][sent2].terms.length; term++) {
            token = t[par].sentences[sent][sent2].terms[term];
            tokens.push({
              section: section,
              offset: token.offset.start,
              length: token.offset.length,
              paragraph: paragraph,
              sentence: sentence,
              index: tokenIndex,
              text: token.text,
              pre: token.pre,
              post: token.post,
            });
            tokenIndex++;
          }
        }
        sentence++;
      }
      paragraph++;
    }
  }
  return tokens;
};

export const importTokens = (tokens) => {
  //const indexFrom1 = tokens[0].offset && tokens[0].offset === 1;
  let paragraph = 0;

  let offset = 0;
  let totalLength = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].text == null) {
      if (tokens[i].token != null) {
        tokens[i].text = tokens[i].token;
      } else {
        alert("Invalid token data:\n\nimported tokens must have 'text' or 'token' field");
        return null;
      }
    }
    if (tokens[i].offset == null && tokens[i].start != null) tokens[i].offset = tokens[i].start;
    if (tokens[i].length == null) tokens[i].length = tokens[i].text.length;

    if (tokens[i].pre == null) tokens[i].pre = "";
    if (tokens[i].post == null && tokens[i].space != null) tokens[i].post = tokens[i].space;
    if (tokens[i].post == null) {
      if (tokens[i].offset != null && tokens[i].length != null) {
        tokens[i].post =
          i < tokens[i].length - 1
            ? " ".repeat(Math.max(0, tokens[i + 1].offset - tokens[i].offset - tokens[i].length))
            : "";
      } else {
        tokens[i].post = " ";
      }
    }

    totalLength = tokens[i].length + tokens[i].pre.length + tokens[i].post.length;

    if (tokens[i].offset == null) {
      tokens[i].offset = offset;
      offset = offset + totalLength;
    }

    if (i < tokens.length - 1 && tokens[i + 1].offset < tokens[i].offset + totalLength) {
      alert(
        `Invalid token position data. The length of "${
          tokens[i].pre + tokens[i].text + tokens[i].post
        }" on position ${tokens[i].offset} exeeds the offset/start position of the next token`
      );
      return null;
    }

    if (tokens[i].paragraph == null) tokens[i].paragraph = paragraph;
    if (tokens[i].text.includes("\n") || tokens[i].post.includes("\n")) paragraph++;
    if (tokens[i].section == null) tokens[i].section = "text";
    tokens[i].index = i;
  }

  return tokens;
};

export const importTokenAnnotations = (tokens, codes) => {
  if (tokens.length === 0) return [];
  let annotations = [];
  let codeTracker = {};
  let section = tokens[0].section;
  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i].annotations) {
      for (let annotation of Object.values(codeTracker)) annotations.push(annotation);
      codeTracker = {};
      continue;
    }

    let annotationDict = {};
    for (let annotation of tokens[i].annotations) {
      if (!codes[annotation.value]) {
        codes[annotation.value] = [annotation.name];
      } else {
        if (!codes[annotation.value].includes(annotation.name))
          codes[annotation].push(annotation.name);
      }

      annotationDict[annotation.name] = annotation.value;

      const prevTokenPost = i > 0 ? tokens[i - 1].post : "";
      if (codeTracker[annotation.name] == null)
        codeTracker[annotation.name] = {
          index: i,
          code: annotation.value,
          offset: tokens[i].offset,
          text: tokens[i].text,
          section: tokens[i].section,
          length: tokens[i].length,
        };
      if (codeTracker[annotation.name].code === annotation.value) {
        codeTracker[annotation.name].length =
          tokens[i].offset + tokens[i].length - codeTracker[annotation.name].offset;
        codeTracker[annotation.name].text += prevTokenPost + tokens[i].pre + tokens[i].post;
      }
    }

    for (let key of Object.keys(codeTracker)) {
      if (annotationDict[key] == null) {
        annotations.push(...codeTracker[key]);
        codeTracker[key] = null;
        continue;
      }
      if (annotationDict[key] !== codeTracker[key].code) {
        annotations.push(codeTracker[key]);
        codeTracker[key] = {
          index: i,
          code: annotationDict[key],
          offset: tokens[i].offset,
          text: tokens[i].text,
          section: tokens[i].section,
          length: tokens[i].length,
        };
      }
    }

    if (i < tokens.length - 1 && tokens[i + 1].section !== section) {
      for (let annotation of Object.values(codeTracker)) annotations.push(annotation);
      codeTracker = {};
      section = tokens[i].section;
      continue;
    }
  }
  for (let annotation of Object.values(codeTracker)) annotations.push(annotation);

  return annotations;
};

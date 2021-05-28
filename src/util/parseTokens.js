import nlp from "compromise";
import paragraphs from "compromise-paragraphs";
nlp.extend(paragraphs);

export const parseTokens = (texts) => {
  // map to single array.
  // for some reason there's an extra array layer between sents and pars...
  // I've only found cases where lenght is 1, but I'll map it just in case
  const tokens = [];
  let token = null;
  let paragraph = 0;
  let sentence = 0;
  let tokenIndex = 0;
  let nextOffset = 0;
  let sectionOffset = 0;
  let t = null;
  let text = null;
  for (let section of Object.keys(texts)) {
    text = texts[section];
    t = nlp.tokenize(text).paragraphs().json({ offset: true });
    for (let par = 0; par < t.length; par++) {
      for (let sent = 0; sent < t[par].sentences.length; sent++) {
        for (let sent2 = 0; sent2 < t[par].sentences[sent].length; sent2++) {
          for (let term = 0; term < t[par].sentences[sent][sent2].terms.length; term++) {
            token = t[par].sentences[sent][sent2].terms[term];
            tokens.push({
              section: section,
              offset_section: token.offset.start,
              paragraph: paragraph,
              sentence: sentence,
              index: tokenIndex,
              text: token.text,
              pre: token.pre,
              post: token.post,
              offset: token.offset.start + sectionOffset, // this is the global offset (across sections)
              length: token.offset.length,
            });
            tokenIndex++;
            nextOffset = token.offset.start + token.offset.length;
          }
        }
        sentence++;
      }
      paragraph++;
      sectionOffset = nextOffset;
    }
  }
  return tokens;
};

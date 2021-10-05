import { useState, useEffect } from "react";
import { prepareDocument } from "util/createDocuments";

const defaultSettings = {
  // These are not part of the codebook, because they depend on the type of task
  // (so they results from certain codebook settings, but the user doesn't need to see this)
  height: 75,
  textUnitPosition: 1 / 4,
  showAnnotations: false,
  canAnnotate: true,
};

/**
 * Custom hook for async composing of the itemBundle
 *
 * @param {*} item
 * @param {*} codebook
 * @param {*} settings
 */
const useItemBundle = (item, codebook, settings = defaultSettings, preview) => {
  const [itemBundle, setItemBundle] = useState(null);
  useEffect(() => {
    if (!item) return null;
    prepareItemBundle(item, codebook, settings, preview, setItemBundle);
  }, [item, codebook, settings, setItemBundle, preview]);

  return itemBundle;
};

/**
 * Given an item and codebook, prepares a bundle to send to the annotator
 * The bundle contains everything the annotator needs, including codebook settings
 *
 * @param {*} item
 * @param {*} codebook
 * @param {*} settings
 * @param {*} setItemBundle
 * @returns
 */
export const prepareItemBundle = async (item, codebook, settings, preview, setItemBundle) => {
  let itemBundle = { ...item };

  // For convenience, also allow item to just have a 'text' key with a string (instead of text_fields)
  if (!itemBundle.text_fields && itemBundle.text)
    itemBundle.text_fields = [{ name: "text", value: itemBundle.text }];

  itemBundle = prepareDocument(itemBundle);

  if (!itemBundle) return;
  itemBundle.textUnitSpan = getUnitSpan(itemBundle);
  itemBundle.writable = false; // this prevents overwriting annotations before they have been loaded (in <ManageAnnotations>)
  itemBundle.codebook = codebook;
  itemBundle.settings = settings;
  itemBundle.settings.saveAnnotations = !preview;
  console.log(itemBundle);
  if (itemBundle) setItemBundle(itemBundle);
};

/**
 * Gets the char span for the coding unit.
 * Needed for tokenization agnostic storing of annotations
 */
const getUnitSpan = (itemBundle) => {
  const firstUnitToken = itemBundle.tokens.find((token) => token.codingUnit);
  let lastUnitTokenIndex = itemBundle.tokens.lastIndexOf((token) => token.codingUnit);

  let lastUnitToken;
  if (lastUnitTokenIndex < 0) {
    lastUnitToken = itemBundle.tokens[itemBundle.tokens.length - 1];
  } else lastUnitToken = itemBundle.tokens[lastUnitTokenIndex];

  return [firstUnitToken.offset, lastUnitToken.offset + lastUnitToken.length];
};

export default useItemBundle;

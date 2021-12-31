const gsmReplacements = [
  ["‘", "'"],
  ["’", "'"],
  ["”", '"'],
  ["”", '"'],
  ["“", '"'],
  ["–", "-"]
];

export const replaceEasyGsmWins = (text: string) =>
  gsmReplacements.reduce(
    (acc, replacement) => acc.replace(replacement[0], replacement[1]),
    text
  );

export const replaceCurlyApostrophes = (rawText: string) =>
  rawText.replace(/[\u2018\u2019]/g, "'");

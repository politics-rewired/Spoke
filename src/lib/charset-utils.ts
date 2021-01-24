/* eslint-disable import/prefer-default-export */

const gsmReplacements = [
  ["‘", "'"],
  ["’", "'"],
  ["”", '"'],
  ["”", '"'],
  ["“", '"'],
  ["–", "-"]
];

export const replaceEasyGsmWins = (text) =>
  gsmReplacements.reduce(
    (acc, replacement) => acc.replace(replacement[0], replacement[1]),
    text
  );

/* eslint-disable import/prefer-default-export */

export const isBlock = (text: string) => {
  try {
    const _newBlock = JSON.parse(text);
    return true;
  } catch (ex) {
    return false;
  }
};

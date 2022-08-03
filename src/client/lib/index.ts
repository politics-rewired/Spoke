export const supportsClipboard = () =>
  navigator?.clipboard?.readText !== undefined;

export const readClipboardText = async () => {
  if (navigator?.clipboard?.readText) {
    return navigator.clipboard.readText().catch(() => "");
  }
  return Promise.resolve("");
};

export const writeClipboardText = async (text: string) => {
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => {});
  }
  return Promise.resolve();
};

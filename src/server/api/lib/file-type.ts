/* eslint-disable import/prefer-default-export */
/* eslint-disable no-bitwise */
import { FileMagic, MagicFlags } from "@npcz/magic";

export const getFileType = async (filePath: string) => {
  FileMagic.magicFile = require.resolve("@npcz/magic/dist/magic.mgc");

  if (process.platform === "darwin" || process.platform === "linux") {
    FileMagic.defaulFlags = MagicFlags.MAGIC_PRESERVE_ATIME;
  }

  const magic = await FileMagic.getInstance();
  const fileType = magic.detect(
    filePath,
    magic.flags | MagicFlags.MAGIC_MIME_TYPE
  );
  return fileType;
};

import { ScriptWarningContext } from "../ScriptLinkWarningDialog";
import { SHORTLINK_DOMAINS, GENERIC_DOMAINS } from './lib'

export const getWarningContextForScript = (script: string): void => {
    let warningContext;
    const scriptArray = script.split(' ')

    // filter media attachments by excluding array entries that start with '['
    const filteredScripts = scriptArray.filter(word => !word.startsWith('['))
    filteredScripts.forEach(word => {
      const wordHasGenericLink = GENERIC_DOMAINS.reduce((acc: boolean, domain: string) => acc || word.includes(domain), false);
      const wordHasLinkShortener = SHORTLINK_DOMAINS.reduce((acc: boolean, domain: string) => acc || word.includes(domain), false);

    if (wordHasGenericLink) {
      warningContext = ScriptWarningContext.GenericLink;
    }
    if (wordHasLinkShortener) {
      warningContext = ScriptWarningContext.ShortLink;
    }
  })

  return warningContext
};  
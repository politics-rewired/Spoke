import { config, clientConfig } from "../../config";

// the site is not very useful without auth0, unless you have a session cookie already
// good for doing dev offline
const externalLinks = config.NO_EXTERNAL_LINKS
  ? ""
  : `<link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Poppins">
  <script src="https://cdn.auth0.com/js/lock/11.0.1/lock.min.js"></script>`;

const windowVars = Object.keys(clientConfig).map(varName => {
  const value = clientConfig[varName];
  const escapedValue = typeof value === "string" ? `"${value}"` : value;
  return `window.${varName}=${escapedValue};`;
});

export default function renderIndex(html, css, assetMap, store) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
    <title>Spoke</title>
    ${externalLinks}
    <style>
      /* CSS declarations go here */
      body {
        font-family: 'Poppins';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;

        padding: 0;
        margin: 0;
        height: 100%;
        font-size: 14px;
      }

      /**/
    </style>
    <style data-aphrodite>${css.content}</style>
  </head>
  <body>
    <div id="mount">${html}</div>
    <script>
      window.INITIAL_STATE=${JSON.stringify(store.getState())}
      window.RENDERED_CLASS_NAMES=${JSON.stringify(css.renderedClassNames)}
      ${windowVars.join("      \n")}
    </script>
    <script src="${assetMap["bundle.js"]}"></script>
  </body>
</html>
`;
}

import { green, grey, orange, red } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";
import DeleteIcon from "@material-ui/icons/Delete";
import React from "react";

import { ScriptToken, ScriptTokenType, scriptToTokens } from "../lib/scripts";

const tokensToElems = (tokens: ScriptToken[]) =>
  tokens.map((token, index) => {
    const key = `${index}-${token.text}`;
    switch (token.type) {
      case ScriptTokenType.CustomField:
        return (
          <span key={key} style={{ color: green[500] }}>
            {token.text}
          </span>
        );
      case ScriptTokenType.UndefinedField:
        return (
          <span key={key} style={{ color: red[500] }}>
            {token.text}
          </span>
        );
      default:
        return token.text;
    }
  });

const useStyles = makeStyles({
  label: {
    fontSize: "0.8em"
  },
  constainer: {
    display: "flex",
    alignItems: "center"
  },
  scriptField: {
    borderBottom: "1px solid #cccccc",
    paddingBottom: "3px",
    cursor: "pointer",
    flexGrow: 1
  },
  warnLabel: {
    fontSize: "0.8em",
    color: orange[800]
  },
  errorLabel: {
    fontSize: "0.8em",
    color: red[600]
  }
});

interface ScriptOptionBlockProps extends React.HTMLProps<HTMLDivElement> {
  script: string;
  customFields: string[];
  placeholder?: string;
  label?: string;
  onEditScript?: () => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

export const ScriptOptionBlock: React.FC<ScriptOptionBlockProps> = (props) => {
  const {
    label,
    script,
    customFields,
    placeholder = "Enter a script...",
    onEditScript,
    onDelete,
    ...rest
  } = props;

  const classes = useStyles();

  const emptyScript = script.trim().length === 0;

  const { tokens, undefinedFieldsUsed } = scriptToTokens({
    script,
    customFields
  });

  const scriptElems = emptyScript ? (
    <div style={{ color: grey[500] }}>{placeholder}</div>
  ) : (
    tokensToElems(tokens)
  );

  return (
    <div {...rest}>
      {label && <div className={classes.label}>{label}</div>}
      <div className={classes.constainer}>
        <div className={classes.scriptField} onClick={onEditScript}>
          {scriptElems}
        </div>
        {onDelete && (
          <Tooltip title="Deleting will not take effect until you save!">
            <IconButton onClick={onDelete}>
              <DeleteIcon fontSize="small" style={{ color: red[500] }} />
            </IconButton>
          </Tooltip>
        )}
      </div>
      {emptyScript && (
        <div className={classes.errorLabel}>Script cannot be empty</div>
      )}
      {undefinedFieldsUsed.length > 0 && (
        <div className={classes.warnLabel}>
          Script cannot use an invalid custom field:{" "}
          {undefinedFieldsUsed.join(", ")}
        </div>
      )}
    </div>
  );
};

export default ScriptOptionBlock;

import React from "react";
import BaseForm from "react-formal";

import GSAutoReplyTokensField from "./GSAutoReplyTokensField";
import GSDateField from "./GSDateField";
import GSPasswordField from "./GSPasswordField";
import GSScriptField from "./GSScriptField";
import GSScriptOptionsField from "./GSScriptOptionsField";
import GSSelectField from "./GSSelectField";
import GSTextField from "./GSTextField";

interface Props<TAs extends React.ElementType = any> {
  as?: TAs;
  [key: string]: any;
}

interface InnerProps {
  type?: string;
  [key: string]: any;
}

// For addInputTypes workaround, see: https://github.com/jquense/react-formal/issues/167#issuecomment-525040912
// For named function, see: https://github.com/yannickcr/eslint-plugin-react/pull/2399
const SpokeFormField = React.forwardRef<unknown, Props>(function Component(
  { children, as, ...props },
  ref
) {
  return (
    <BaseForm.Field ref={ref} {...props}>
      {(innerProps: InnerProps) => {
        if (typeof children === "function") return children(innerProps);

        const { ...fieldProps } = innerProps;
        const { type } = props;
        let Input = as;

        // We may get passed a component (e.g. type={Autocomplete})
        if (typeof props.type === "function") {
          Input = props.type;
        }

        if (!Input) {
          if (type && ["string", "number", "email"].includes(type)) {
            Input = GSTextField;
          } else if (type === "date") {
            Input = GSDateField;
          } else if (type === "script") {
            Input = GSScriptField;
          } else if (type === "scriptoptions") {
            Input = GSScriptOptionsField;
          } else if (type === "select") {
            Input = GSSelectField;
          } else if (type === "password") {
            Input = GSPasswordField;
          } else if (type === "autoreplytokens") {
            Input = GSAutoReplyTokensField;
          } else {
            Input = type || GSTextField;
          }
        }

        return (
          <Input {...props} {...fieldProps}>
            {children}
          </Input>
        );
      }}
    </BaseForm.Field>
  );
});

export default SpokeFormField;

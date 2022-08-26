import { Component } from "react";
import type { FieldProps } from "react-formal/Field";

import type { TruthyString } from "../../lib/js-types";

export interface GSFormFieldProps extends FieldProps {
  floatingLabelText: TruthyString;
  label: string;
  ["data-test"]?: any;
}

export class GSFormField<P extends GSFormFieldProps, S> extends Component<
  P,
  S
> {
  // eslint-disable-next-line react/no-unused-class-component-methods
  floatingLabelText() {
    return this.props.floatingLabelText === false
      ? null
      : this.props.floatingLabelText || this.props.label;
  }
}

export default GSFormField;

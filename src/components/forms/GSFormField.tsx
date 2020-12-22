import { Component } from "react";
import Form from "react-formal";

import { TruthyString } from "../../lib/js-types";

export interface GSFormFieldProps extends Form.Field.FieldProps {
  floatingLabelText: TruthyString;
  label: string;
  ["data-test"]?: any;
}

export class GSFormField<P extends GSFormFieldProps, S> extends Component<
  P,
  S
> {
  floatingLabelText() {
    return this.props.floatingLabelText === false
      ? null
      : this.props.floatingLabelText || this.props.label;
  }
}

export default GSFormField;

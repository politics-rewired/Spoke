import { DateTime } from "luxon";
import DatePicker from "material-ui/DatePicker";
import React from "react";

import GSFormField from "./GSFormField";

export default class GSDateField extends GSFormField {
  // sameHMS(lead: Datetime, follow: DateTime): DateTime {
  pickerOnChange(newJSDate) {
    const { value: propDate, onChange } = this.props;

    const newLuxonDate = DateTime.fromJSDate(newJSDate).set({
      hour: propDate.hour,
      minute: propDate.minute,
      second: propDate.second
    });
    onChange(newLuxonDate.isValid ? newLuxonDate.toISO() : null);
  }

  render() {
    const {
      value: propDate,
      type: _type,
      errorText: _errorText,
      ...childProps
    } = this.props;
    const oldDate = DateTime.fromISO(propDate); // parse if passed as iso string
    childProps.value = oldDate.isValid ? oldDate.toJSDate() : childProps.value;

    return (
      <DatePicker
        {...childProps}
        floatingLabelText={this.floatingLabelText()}
        onChange={(_, newDate) => this.pickerOnChange(newDate)}
      />
    );
  }
}

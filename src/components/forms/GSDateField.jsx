import { DateTime } from "luxon";
import DatePicker from "material-ui/DatePicker";
import React from "react";

import GSFormField from "./GSFormField";

export default class GSDateField extends GSFormField {
  render() {
    const {
      value: propDate,
      type: _type,
      utcOffset,
      errorText: _errorText,
      onChange,
      ...childProps
    } = this.props;
    console.log(utcOffset);
    const oldDate = DateTime.fromISO(propDate).plus({
      minutes: utcOffset - DateTime.local().offset
    });
    childProps.value = oldDate.isValid ? oldDate.toJSDate() : childProps.value;

    return (
      <DatePicker
        {...childProps}
        floatingLabelText={this.floatingLabelText()}
        onChange={(_, date) => {
          const newDate = DateTime.fromJSDate(date);
          onChange(
            !newDate.isValid
              ? null
              : newDate
                  .set(
                    oldDate.isValid
                      ? {
                          hour: oldDate.hour,
                          minute: oldDate.minute,
                          second: oldDate.second
                        }
                      : {}
                  )
                  .plus({
                    minutes: DateTime.local().offset - utcOffset
                  })
                  .toISO()
          );
        }}
      />
    );
  }
}

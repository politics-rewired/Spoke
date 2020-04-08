import React from "react";
import DatePicker from "material-ui/DatePicker";
import moment from "moment";
import GSFormField from "./GSFormField";

export default class GCDateField extends GSFormField {
  render() {
    const {
      value: momentVal,
      type,
      utcOffset,
      errorText,
      onChange,
      ...childProps
    } = this.props;

    const momentDate = moment(momentVal);
    let oldDate = null;
    if (momentDate.isValid()) {
      const fakeDate = momentDate
        .add(utcOffset - moment().utcOffset(), "minutes")
        .toDate();
      oldDate = moment(fakeDate).toObject();
      childProps.value = fakeDate;
    }

    return (
      <DatePicker
        {...childProps}
        floatingLabelText={this.floatingLabelText()}
        onChange={(_, date) => {
          let newDate = moment(date);
          if (!newDate.isValid()) {
            onChange(null);
          } else {
            newDate = newDate.toObject();
            if (oldDate) {
              newDate.hours = oldDate.hours;
              newDate.minutes = oldDate.minutes;
              newDate.seconds = oldDate.seconds;
            }
            newDate = moment(newDate).add(
              moment().utcOffset() - utcOffset,
              "minutes"
            );
            onChange(newDate.toDate());
          }
        }}
      />
    );
  }
}

// - why `type` cannot be "date"
// if type={"date"}, React's inputValueTracking.js will kick in,
//      then Material-ui will automatically nicely format JSDates into 12/21/2020 format,
//      then inputValueTracking will not understand that format and then block the update,
//      then the field will revert to having a value of undefined again
//      then material-ui will automatically format the null value as as the text "mm/dd/yyyy"
//      which will be colored black and overlap with the desired floatingLabelText() (e.g. "Due By")

import { DateTime } from "luxon";
import { DatePicker, DatePickerProps } from "material-ui";
import React from "react";

import { ISODateString } from "../../lib/js-types";
import { GSFormField, GSFormFieldProps } from "./GSFormField";

interface GSDateFieldProps {
  onChange: (d: ISODateString | null) => void;
  value: string | undefined;
}

export default class GSDateField extends GSFormField<
  GSFormFieldProps & DatePickerProps & GSDateFieldProps,
  Record<string, unknown>
> {
  pickerOnChange(newDate: DateTime): void {
    const oldDate: DateTime = DateTime.fromISO(this.props.value as string);
    const newDateWithHMS = oldDate.isValid
      ? newDate.set({
          hour: oldDate.hour,
          minute: oldDate.minute,
          second: oldDate.second
        })
      : newDate;
    this.props.onChange(newDateWithHMS.isValid ? newDateWithHMS.toISO() : null);
  }

  render() {
    const parsedPropDate = DateTime.fromISO(this.props.value as string);
    return (
      <DatePicker
        value={parsedPropDate.isValid ? parsedPropDate.toJSDate() : undefined}
        fullWidth={this.props.fullWidth}
        autoOk={this.props.autoOk}
        locale={this.props.locale}
        className={this.props.className}
        name={this.props.name}
        // type={this.props.type} // see above
        data-test={this.props["data-test"] as Date}
        floatingLabelText={this.floatingLabelText()}
        onChange={(_, newDate) => {
          this.pickerOnChange(DateTime.fromJSDate(newDate));
        }}
      />
    );
  }
}

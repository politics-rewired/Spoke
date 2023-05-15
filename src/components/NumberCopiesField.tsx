import TextField from "@material-ui/core/TextField";
import React, { useState } from "react";

export interface NumberCopiesFieldProps {
  onChange: React.ChangeEventHandler<unknown>;
}

export const NumberCopiesField: React.FC<NumberCopiesFieldProps> = (props) => {
  const [qty, setQty] = useState<number>(1);
  const handleQtyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newQty = event.target.value as number;
    // Enforce 20 copy limit based on Spoke client team feedback
    // https://github.com/politics-rewired/Spoke/issues/1608#issuecomment-1547025486
    if (newQty > 0 && newQty < 21) {
      setQty(newQty);
      props.onChange(event);
    }
  };

  return (
    <TextField
      label="Quantity"
      type="number"
      value={qty}
      onChange={handleQtyChange}
    />
  );
};

export default NumberCopiesField;

import uniqBy from "lodash/uniqBy";
import type { KeyboardEventHandler } from "react";
import React, { useEffect, useRef, useState } from "react";
import CreatableSelect from "react-select/creatable";

import { optOutTriggers } from "../../lib/opt-out-triggers";
import type { GSFormFieldProps } from "./GSFormField";

interface GSAutoReplyTokensFieldProps extends GSFormFieldProps {
  selectedOptions?: Option[];
  disabled: boolean;
  onChange: (...args: any[]) => any;
}

interface Option {
  readonly label: string;
  readonly value: string;
}

const createOption = (label: string) => ({
  label,
  value: label
});

const GSAutoReplyTokensField: React.FC<GSAutoReplyTokensFieldProps> = ({
  disabled,
  onChange,
  value: selectedOptions
}) => {
  const initialOptionValue = selectedOptions.map((token: string) =>
    createOption(token)
  );
  const [optionValue, setOptionValue] = useState<readonly Option[]>(
    initialOptionValue
  );

  const [inputValue, setInputValue] = useState("");
  const onChangeValue = optionValue.map((option) => option.value);
  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) initialRender.current = false;
    else onChange(onChangeValue);
  }, [optionValue]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
  };

  const handleChange = (newValue: Option[]) => {
    setOptionValue(newValue);
  };

  const handleKeyDown: KeyboardEventHandler = (event) => {
    if (!inputValue) return;

    const lowerInputValue = inputValue.toLowerCase().trim();
    if (optOutTriggers.includes(lowerInputValue)) {
      setInputValue("");
      return;
    }
    switch (event.key) {
      /* eslint-disable no-case-declarations */
      case ",":
      case "Enter":
      case "Tab":
        const newValue = [...optionValue, createOption(lowerInputValue)];
        const uniqValue = uniqBy(newValue, "value");

        setInputValue("");
        setOptionValue(uniqValue);
        event.preventDefault();
      /* eslint-enable no-case-declarations */
      // no default
    }
  };

  return (
    <div>
      <br />
      Auto Replies
      <CreatableSelect
        components={{ DropdownIndicator: null }}
        inputValue={inputValue}
        isClearable
        isMulti
        menuIsOpen={false}
        onChange={handleChange}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Words or phrases that Spoke should automatically respond to using this script, separated by commas"
        value={optionValue}
        isDisabled={disabled}
      />
    </div>
  );
};

export default GSAutoReplyTokensField;

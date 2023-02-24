import type { TagInfoFragment } from "@spoke/spoke-codegen";
import React from "react";
import type { StylesConfig } from "react-select";
import Select from "react-select";

import MenuPortal from "./MenuPortal";

const tagStyles: StylesConfig<TagInfoFragment, true> = {
  option: (styles, { data }) => ({
    ...styles,
    color: data.textColor
  }),
  multiValue: (styles, { data }) => ({
    ...styles,
    background: data.backgroundColor
  }),
  multiValueLabel: (styles, { data }) => ({
    ...styles,
    color: data.textColor
  }),
  multiValueRemove: (styles, { data }) => ({
    ...styles,
    color: data.textColor
  })
};

interface TagSelectorProps {
  dataSource: TagInfoFragment[];
  value: TagInfoFragment[];
  onChange: (changedTags: TagInfoFragment[]) => Promise<void> | void;
}

const TagSelector: React.FC<TagSelectorProps> = (props) => {
  const handleSelectChange = (tagsArray: TagInfoFragment[]) =>
    props.onChange(tagsArray);

  const { dataSource, value } = props;

  return (
    <>
      <p>Apply tags:</p>
      <Select<TagInfoFragment>
        isMulti
        isSearchable
        value={value}
        components={{ MenuPortal }}
        options={dataSource}
        getOptionValue={(option: TagInfoFragment) => option.id}
        getOptionLabel={(option: TagInfoFragment) => option.title}
        menuPortalTarget={document.body}
        onChange={handleSelectChange}
        styles={tagStyles}
      />
    </>
  );
};

export default TagSelector;

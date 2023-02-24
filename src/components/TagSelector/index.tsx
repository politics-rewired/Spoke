import type { CampaignContactTag, Tag } from "@spoke/spoke-codegen";
import React from "react";
import type { StylesConfig } from "react-select";
import Select from "react-select";

import MenuPortal from "./MenuPortal";

type MenuValue = {
  value: string;
  label: string;
  textColor: string;
  backgroundColor: string;
};

const tagStyles: StylesConfig<MenuValue, true> = {
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
  dataSource: Tag[];
  value: CampaignContactTag[];
  onChange: (changedTags: CampaignContactTag[]) => Promise<void> | void;
}

const TagSelector: React.FC<TagSelectorProps> = (props) => {
  // differentiate select and clear tag actions
  const handleSelectChange = (tagsArray: MenuValue[]) => {
    const { dataSource, onChange } = props;

    const selectedTags: CampaignContactTag[] = [];
    tagsArray.forEach((tag) => {
      const newTag = dataSource.find((t) => t.id === tag.value);
      if (newTag) selectedTags.push({ tag: newTag });
    });
    onChange(selectedTags);
  };

  const { dataSource, value } = props;
  const menuOptions: MenuValue[] = dataSource.map((tag) => ({
    label: tag.title,
    value: tag.id,
    textColor: tag.textColor,
    backgroundColor: tag.backgroundColor
  }));
  const menuValues: MenuValue[] = value.map((tag) => ({
    value: tag.tag.id,
    label: tag.tag.title,
    textColor: tag.tag.textColor,
    backgroundColor: tag.tag.backgroundColor
  }));

  return (
    <>
      <p>Apply tags:</p>
      <Select<MenuValue>
        isMulti
        isSearchable
        value={menuValues}
        components={{ MenuPortal }}
        options={menuOptions}
        menuPortalTarget={document.body}
        onChange={handleSelectChange}
        styles={tagStyles}
      />
    </>
  );
};

export default TagSelector;

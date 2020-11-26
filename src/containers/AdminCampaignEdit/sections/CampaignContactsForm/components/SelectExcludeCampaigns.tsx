import sortBy from "lodash/sortBy";
import React from "react";
import Select from "react-select";
import { ValueType } from "react-select/lib/types";

interface OptionType {
  label: string;
  value: string;
}

interface SelectExcludeCampaignsProps {
  allOtherCampaigns: {
    id: string;
    title: string;
    createdAt: string;
  }[];
  selectedCampaignIds: string[];
  onChangeExcludedCamapignIds(ids: string[]): void;
}

const mapOption = ({ id, title }: { id: string; title: string }) => ({
  label: title,
  value: id
});

export const SelectExcludeCampaigns: React.SFC<SelectExcludeCampaignsProps> = (
  props
) => {
  const { allOtherCampaigns, selectedCampaignIds } = props;
  const value = allOtherCampaigns
    .filter(({ id }) => selectedCampaignIds.includes(id))
    .map(mapOption);
  const sortedCampaigns = sortBy(allOtherCampaigns, ["createdAt"], ["desc"]);
  const options = sortedCampaigns.map(mapOption);

  const handleOnChangeSelections = (selectedOptions: ValueType<OptionType>) => {
    if (!Array.isArray(selectedOptions)) {
      return props.onChangeExcludedCamapignIds([]);
    }
    const selectedCampaignIds = selectedOptions.map((option) => option.value);
    props.onChangeExcludedCamapignIds(selectedCampaignIds);
  };

  return (
    <div>
      <p>
        You can filter out contacts from this upload that are already uploaded
        to an existing Spoke campaigns (regardless of whether they have been
        texted yet in that campaign).
      </p>
      <Select
        name="Campaigns"
        placeholder="Select existing campaigns"
        isMulti
        options={options}
        value={value}
        onChange={handleOnChangeSelections}
        className="basic-multi-select"
        classNamePrefix="select"
      />
    </div>
  );
};

export default SelectExcludeCampaigns;

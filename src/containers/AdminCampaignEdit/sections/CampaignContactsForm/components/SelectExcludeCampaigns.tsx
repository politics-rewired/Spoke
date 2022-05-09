import sortBy from "lodash/sortBy";
import React from "react";
import Select from "react-select";

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

export const SelectExcludeCampaigns: React.FC<SelectExcludeCampaignsProps> = (
  props
) => {
  const { allOtherCampaigns, selectedCampaignIds } = props;
  const value = allOtherCampaigns
    .filter(({ id }) => selectedCampaignIds.includes(id))
    .map(mapOption);
  const sortedCampaigns = sortBy(allOtherCampaigns, ["createdAt"], ["desc"]);
  const options = sortedCampaigns.map(mapOption);

  const handleOnChangeSelections = (selectedOptions: OptionType[]) => {
    if (!Array.isArray(selectedOptions)) {
      return props.onChangeExcludedCamapignIds([]);
    }
    const newSelectedCampaignIds = selectedOptions.map(
      (option) => option.value
    );
    props.onChangeExcludedCamapignIds(newSelectedCampaignIds);
  };

  return (
    <div>
      <p>
        You can <span style={{ fontWeight: "bold" }}>optionally</span> exclude
        contacts from this upload who are already uploaded to existing Spoke
        campaigns (regardless of whether they have been texted yet in those
        campaigns).
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

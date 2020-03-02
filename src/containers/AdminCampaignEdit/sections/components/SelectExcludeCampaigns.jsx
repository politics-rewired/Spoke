import PropTypes from "prop-types";
import React from "react";
import sortBy from "lodash/sortBy";

import Select from "react-select";

const mapOption = ({ id, title }) => ({
  label: title,
  value: id
});

const SelectExcludeCampaigns = props => {
  const { allOtherCampaigns, selectedCampaignIds } = props;
  const value = allOtherCampaigns
    .filter(({ id }) => selectedCampaignIds.includes(id))
    .map(mapOption);
  const sortedCampaigns = sortBy(allOtherCampaigns, ["createdAt"], ["desc"]);
  const options = sortedCampaigns.map(mapOption);

  const handleOnChangeSelections = selectedOptions => {
    const selectedCampaignIds = selectedOptions.map(option => option.value);
    props.onChangeExcludedCamapignIds(selectedCampaignIds);
  };

  return (
    <div>
      <p>
        You can also filter out contacts from this upload that are already
        uploaded to an existing Spoke campaigns (regardless of whether they have
        been texted yet in that campaign).
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

SelectExcludeCampaigns.propTypes = {
  allOtherCampaigns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired
    })
  ).isRequired,
  selectedCampaignIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChangeExcludedCamapignIds: PropTypes.func.isRequired
};

export default SelectExcludeCampaigns;

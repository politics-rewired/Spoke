import AutoComplete from "material-ui/AutoComplete";
import RaisedButton from "material-ui/RaisedButton";
import React from "react";

import { dataSourceItem } from "../../../../../components/utils";
import { dataTest } from "../../../../../lib/attributes";
import { Texter } from "../types";

const inlineStyles = {
  autocomplete: {
    marginBottom: 24
  }
};

interface Props {
  orgTexters: any;
  texters: Texter[];
  searchText: string;
  addTexter(newTexter: any): void;
  addAllTexters(): void;
  removeEmptyTexters(): void;
  handleSearchTexters(term: string): void;
}

interface SearchReturn {
  text: string;
  rawValue: string;
  value: any;
}

const CampaignTextersManager: React.SFC<Props> = (props: Props) => {
  const {
    orgTexters,
    texters,
    searchText,
    addTexter,
    addAllTexters,
    removeEmptyTexters,
    handleSearchTexters
  } = props;

  const dataSource = orgTexters
    .filter(
      (orgTexter) => !texters.find((texter) => texter.id === orgTexter.id)
    )
    .map((orgTexter) => dataSourceItem(orgTexter.displayName, orgTexter.id));

  const filter = (searchTerm: string, key: string) =>
    key === "allTexters"
      ? true
      : AutoComplete.caseInsensitiveFilter(searchTerm, key);

  const handleAddTexter = (value: SearchReturn) => {
    // If you're searching but get no match, value is a string
    // representing your search term, but we only want to handle matches
    if (typeof value === "object") {
      const texterId = value.value.key;
      const newTexter = props.orgTexters.find(
        (texter) => texter.id === texterId
      );
      const texterToAdd = {
        id: texterId,
        firstName: newTexter.firstName,
        assignment: {
          contactsCount: 0,
          needsMessageCount: 0
        }
      };
      addTexter(texterToAdd);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <AutoComplete
        style={inlineStyles.autocomplete}
        autoFocus
        onFocus={() => handleSearchTexters("")}
        onUpdateInput={handleSearchTexters}
        searchText={searchText}
        filter={filter}
        hintText="Search for texters to assign"
        dataSource={dataSource}
        onNewRequest={handleAddTexter}
      />
      <div>
        <RaisedButton
          {...dataTest("addAll")}
          label="Add All"
          onClick={addAllTexters}
        />
        <RaisedButton
          {...dataTest("addAll")}
          label="Remove Empty"
          onClick={removeEmptyTexters}
        />
      </div>
    </div>
  );
};

export default CampaignTextersManager;

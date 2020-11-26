import { MenuItem } from "material-ui/Menu";
import React from "react";

export function dataSourceItem(name, key) {
  return {
    text: name,
    rawValue: key,
    value: <MenuItem key={key} primaryText={name} />
  };
}

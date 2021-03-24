import { MenuItem } from "material-ui/Menu";
import React from "react";

export interface DataSourceItemType<T = string> {
  text: string;
  rawValue: T;
  value: React.ReactElement;
}

export function dataSourceItem<T = string>(
  name: string,
  key: T
): DataSourceItemType<T> {
  return {
    text: name,
    rawValue: key,
    value: <MenuItem key={`${key}`} primaryText={name} />
  };
}

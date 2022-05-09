export interface DataSourceItemType<T = string> {
  text: string;
  rawValue: T;
}

export function dataSourceItem<T = string>(
  name: string,
  key: T
): DataSourceItemType<T> {
  return {
    text: name,
    rawValue: key
  };
}

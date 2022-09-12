import Box from "@material-ui/core/Box";
import React from "react";

export interface TabPanelProps<T> {
  children?: React.ReactNode;
  index: T;
  value: T;
}

export function TabPanel<T>(props: React.PropsWithChildren<TabPanelProps<T>>) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      <Box p={3}>{children}</Box>
    </div>
  );
}

export default TabPanel;

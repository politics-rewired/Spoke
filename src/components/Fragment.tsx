import React from "react";

export const Fragment: React.StatelessComponent = ({ children }) =>
  React.Children.only(children);

export default Fragment;

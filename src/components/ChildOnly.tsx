import React from "react";

// component mainly for wrapping passed in function-as-component with keys e.g.
// const Counting = ({props: {forNum}}) =>
//   <div>
//     {[1,2,3].map(num =>
//     <ChildOnly key={num}>
//       {forNum(num)}
//     </ChildOnly>
//   </div>
//

export const ChildOnly: React.StatelessComponent = ({ children }) =>
  React.Children.only(children);

export default ChildOnly;

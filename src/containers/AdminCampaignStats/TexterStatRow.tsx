import LinearProgress from "@material-ui/core/LinearProgress";
import type { GetTexterStatsQuery } from "@spoke/spoke-codegen";
import React from "react";

type TexterAssignment = NonNullable<
  NonNullable<
    NonNullable<NonNullable<GetTexterStatsQuery>["campaign"]>["assignments"]
  >[0]
>;

export interface TexterStatRowProps {
  assignment: TexterAssignment;
}

export const TexterStatRow: React.FC<TexterStatRowProps> = ({ assignment }) => {
  const { contactsCount, unmessagedCount, texter, id } = assignment;
  if (contactsCount === 0) {
    return <div key={id} />;
  }

  const percentComplete = Math.round(
    ((contactsCount - unmessagedCount) * 100) / contactsCount
  );

  return (
    <div key={id}>
      {texter.firstName} {texter.lastName}
      <div>{percentComplete}%</div>
      <LinearProgress variant="determinate" value={percentComplete} />
    </div>
  );
};

import { useGetTexterStatsQuery } from "@spoke/spoke-codegen";
import React from "react";

import { TexterStatRow } from "./TexterStatRow";

export interface TexterStatsProps {
  campaignId: string;
}

export const TexterStats: React.FC<TexterStatsProps> = ({ campaignId }) => {
  const { data } = useGetTexterStatsQuery({
    variables: {
      campaignId,
      contactsFilter: {
        messageStatus: "needsMessage"
      }
    }
  });

  const assignments = data?.campaign?.assignments ?? [];
  return (
    <div>
      {assignments.map(
        (assignment) => assignment && <TexterStatRow assignment={assignment} />
      )}
    </div>
  );
};

export default TexterStats;

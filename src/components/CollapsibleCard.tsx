import Card from "@material-ui/core/Card";
import Collapse from "@material-ui/core/Collapse";
import IconButton from "@material-ui/core/IconButton";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import React, { useState } from "react";

interface CollapsibleCardProps {
  children: JSX.Element[];
  disableExpand?: boolean;
  onExpandChange?(expanded: boolean): void;
  // All other standard Card Props
  [x: string]: any;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  children,
  disableExpand = false,
  onExpandChange,
  ...cardProps
}) => {
  const [shown, setShown] = useState<boolean>(false);

  let cardHeader;
  const otherChildren: (
    | JSX.Element
    | React.ReactNode
    | null
    | undefined
  )[] = [];

  const handleClick = () => {
    const sectionShown = !shown;
    setShown(sectionShown);

    if (onExpandChange) {
      onExpandChange(sectionShown);
    }
  };

  React.Children.forEach(children, (child) => {
    if (child?.type?.displayName.includes("CardHeader")) {
      cardHeader = child;
    } else {
      otherChildren.push(child);
    }
  });

  const cardHeaderStyle = disableExpand
    ? cardHeader?.props?.style
    : { ...cardHeader?.props?.style, cursor: "pointer" };

  const updatedCardHeader =
    cardHeader && !disableExpand
      ? React.cloneElement(cardHeader, {
          action: (
            <IconButton>{shown ? <ExpandLess /> : <ExpandMore />}</IconButton>
          ),
          style: cardHeaderStyle,
          onClick: handleClick
        })
      : cardHeader;

  console.log(cardProps);

  return (
    <Card {...cardProps}>
      {updatedCardHeader}
      <Collapse in={shown}>{otherChildren}</Collapse>
    </Card>
  );
};

export default CollapsibleCard;

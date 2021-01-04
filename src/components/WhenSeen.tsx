/* eslint-disable no-unused-vars */
// eslint doesn't understand functions in interfaces
import { isNull } from "lodash/fp";
import React from "react";

interface WhenSeenProps {
  onSeenChange: (isSeen: boolean) => void;
}
class WhenSeen extends React.Component<WhenSeenProps> {
  observer?: IntersectionObserver;

  cliffhangerRef?: Element = undefined;

  constructor(props: WhenSeenProps) {
    super(props);
    this.observer = new IntersectionObserver(([entry]) =>
      props.onSeenChange(entry.isIntersecting)
    );
  }

  onNewRef(newRef: Element | null) {
    if (!isNull(newRef) && this.observer) {
      const oldRef = this.cliffhangerRef;
      if (oldRef !== newRef) {
        if (oldRef) this.observer.unobserve(oldRef);
        this.observer.observe(newRef);
        this.cliffhangerRef = newRef;
      }
    }
  }

  render() {
    return (
      <div ref={(newRef) => this.onNewRef(newRef)}>{this.props.children}</div>
    );
  }
}

export default WhenSeen;

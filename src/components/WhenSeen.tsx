import isNull from "lodash/fp/isNull";
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
      this.props.onSeenChange(entry.isIntersecting)
    );
  }

  onNewRef = (newRef: Element | null) => {
    if (!isNull(newRef) && this.observer) {
      const oldRef = this.cliffhangerRef;
      if (oldRef !== newRef) {
        if (oldRef) this.observer.unobserve(oldRef);
        this.observer.observe(newRef);
        this.cliffhangerRef = newRef;
      }
    }
  };

  render() {
    return <div ref={this.onNewRef}>{this.props.children}</div>;
  }
}

export default WhenSeen;

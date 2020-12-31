/* eslint-disable no-unused-vars */
// eslint doesn't understand functions in interfaces
import { isNull } from "lodash/fp";
import React from "react";

interface WhenSeenProps {
  onSeenChange: (isSeen: boolean) => void;
}
interface WhenSeenState {
  cliffhangerRef?: Element;
}
class WhenSeen extends React.Component<WhenSeenProps, WhenSeenState> {
  observer?: IntersectionObserver;

  state: WhenSeenState = {
    cliffhangerRef: undefined
  };

  constructor(props: WhenSeenProps) {
    super(props);
    this.observer = new IntersectionObserver(([entry]) =>
      props.onSeenChange(entry.isIntersecting)
    );
  }

  onNewRef(newRef: Element | null) {
    if (!isNull(newRef) && this.observer) {
      const oldRef = this.state.cliffhangerRef;
      if (oldRef !== newRef) {
        if (oldRef) this.observer.unobserve(oldRef);
        this.observer.observe(newRef);
        this.setState((prev) => ({ ...prev, cliffhangerRef: newRef }));
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

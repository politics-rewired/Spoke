import React, { PureComponent } from "react";
import { Portal } from "react-portal";
import PropTypes from "prop-types";

const coercePlacement = (p) => (p === "auto" ? "bottom" : p);

const menuPortalCSS = ({
  position,
  appendTo,
  controlElement,
  placement,
  isFixed
}) => {
  let containerLeft = 0,
    containerTop = 0;

  if (appendTo) {
    const { left, top } = appendTo.getBoundingClientRect();
    const { offsetLeft, offsetTop } = appendTo;
    containerLeft = left - offsetLeft;
    containerTop = top - offsetTop;
  }

  // get dimensions of dialog modal
  const rectangle = controlElement.getBoundingClientRect();

  // calculate position for dropdownMenu
  const dropdownPosition = {
    left: rectangle.left - containerLeft,
    position,
    top: rectangle.top + rectangle.height,
    width: rectangle.width,
    zIndex: 99999
  };

  if (isFixed) {
    return {
      ...dropdownPosition,
      top: rect[placement]
    };
  }

  return dropdownPosition;
};

class MenuPortal extends PureComponent {
  static propTypes = {
    menuPlacement: PropTypes.oneOf(["auto", "bottom", "top"]),
    appendTo: PropTypes.instanceOf(Element),
    controlElement: PropTypes.instanceOf(Element),
    menuPosition: PropTypes.oneOf(["absolute", "fixed"])
  };

  static childContextTypes = {
    getPortalPlacement: PropTypes.func
  };

  state = { placement: null };

  getChildContext = () => {
    return { getPortalPlacement: this.getPortalPlacement };
  };

  // callback in case menu needs to flip
  getPortalPlacement = ({ placement }) => {
    const initialPlacement = coercePlacement(this.props.menuPlacement);

    // avoid re-renders if placement hasnt changed
    if (placement !== initialPlacement) {
      this.setState({ placement });
    }
  };
  render() {
    const {
      appendTo,
      children,
      controlElement,
      menuPlacement,
      menuPosition: position
    } = this.props;
    const isFixed = position === "fixed";

    // guard against missing elements
    if ((!appendTo && !isFixed) || !controlElement) {
      return null;
    }

    const placement = this.state.placement || coercePlacement(menuPlacement);
    const state = { position, appendTo, controlElement, placement, isFixed };

    // same wrapper element whether fixed or portalled
    const menuWrapper = (
      <div className="menuPortalWrapper">
        <div style={menuPortalCSS(state)}>{children}</div>
      </div>
    );

    // override createPortal
    const createPortal = (child) => {
      return <Portal>{child}</Portal>;
    };

    return appendTo ? createPortal(menuWrapper) : menuWrapper;
  }
}

export default MenuPortal;

import React, { PureComponent } from "react";
import { Portal } from "react-portal";
import PropTypes from "prop-types";

const coercePlacement = p => (p === "auto" ? "bottom" : p);

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

  // get coordinates for dialog modal
  const rect = controlElement.getBoundingClientRect();

  // calculate position for dropdownMenu
  const r = {
    left: rect.left - containerLeft,
    position,
    top: rect.top + rect.height,
    width: rect.width,
    zIndex: 999999
  };

  if (isFixed) {
    return {
      ...r,
      top: rect[placement]
    };
  }

  return r;
};

export default class MenuPortal extends PureComponent {
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

  // callback for occassions where the menu must "flip"
  getPortalPlacement = ({ placement }) => {
    const initialPlacement = coercePlacement(this.props.menuPlacement);

    // avoid re-renders if the placement has not changed
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

    // bail early if required elements aren't present
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
    const createPortal = child => {
      const node = document.getElementById("portalRoot");

      return <Portal node={node}>{child}</Portal>;
    };

    return appendTo ? createPortal(menuWrapper, appendTo) : menuWrapper;
  }
}

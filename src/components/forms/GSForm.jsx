import { css, StyleSheet } from "aphrodite";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";

import theme from "../../styles/theme";
import GSSubmitButton from "./GSSubmitButton";
import SpokeFormField from "./SpokeFormField";

const styles = StyleSheet.create({
  errorMessage: {
    color: theme.colors.red,
    marginRight: "auto",
    marginLeft: "auto",
    textAlign: "center"
  }
});
export default class GSForm extends React.Component {
  // eslint-disable-next-line react/static-property-placement
  static propTypes = {
    value: PropTypes.object,
    defaultValue: PropTypes.object,
    onChange: PropTypes.func,
    children: PropTypes.array
  };

  state = {
    isSubmitting: false,
    model: null,
    globalErrorMessage: null
  };

  // to display title and script as default values in CannedResponseEditor,
  // state.model must be mapped to children.props.values on mount
  UNSAFE_componentWillMount() {
    const { children } = this.props;

    if (Array.isArray(children)) {
      let model = null;
      children.map((child) => {
        if (child) {
          const { context, value, name } = child.props;
          if (context === "responseEditor" && value) {
            model = { ...model, [name]: value };
          }
        }
        return model;
      });
      this.setState({ model });
    }
  }

  submit = () => {
    if (this.formRef) {
      this.formRef.submit();
    }
  };

  handleFormRefChange = (ref) => {
    this.formRef = ref;
  };

  handleSubmitForm = async (formValues) => {
    this.setState({
      isSubmitting: true,
      globalErrorMessage: null
    });
    if (this.props.onSubmit) {
      try {
        await this.props.onSubmit(formValues);
      } catch (err) {
        this.handleFormSubmitError(err);
      }
    }
    this.setState({ isSubmitting: false });
  };

  handleOnFormChange = (model) => {
    this.setState({ model });
    if (this.props.onChange) {
      this.props.onChange(model);
    }
  };

  handleFormSubmitError = (err) => {
    if (err.message) {
      this.setState({ globalErrorMessage: err.message });
    } else {
      console.error(err);
      this.setState({
        globalErrorMessage:
          "Oops! Your form submission did not work. Contact your administrator."
      });
    }
  };

  getFormErrors = () => {
    let formErrors = {};

    try {
      const value =
        this.props.value || this.state.model || this.props.defaultValue;
      this.props.schema.validateSync(value, { abortEarly: false });
    } catch (err) {
      formErrors = err.inner.reduce((acc, { path, errors }) => {
        return {
          ...acc,
          [path]: errors.map((message) => ({ message }))
        };
      }, {});
    }

    return formErrors;
  };

  renderChildren = (children) => {
    const formErrors = this.getFormErrors();

    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) {
        return child;
      }
      if (child.type === Form.Field || child.type === SpokeFormField) {
        const { name, label } = child.props;
        const error = formErrors[name];
        let clonedElement = child;
        if (error) {
          const errorText = error[0]
            ? error[0].message.replace(name, label)
            : null;
          clonedElement = React.cloneElement(child, { errorText });
        }
        return React.cloneElement(clonedElement, {
          events: ["onBlur"]
        });
      }
      if (child.type === Form.Submit) {
        return React.cloneElement(child, {
          as: GSSubmitButton,
          isSubmitting: this.state.isSubmitting
        });
      }
      if (child.props && child.props.children) {
        return React.cloneElement(child, {
          children: this.renderChildren(child.props.children)
        });
      }
      return child;
    });
  };

  renderGlobalErrorMessage = () => {
    if (!this.state.globalErrorMessage) {
      return "";
    }

    return (
      <div className={css(styles.errorMessage)}>
        {this.state.globalErrorMessage}
      </div>
    );
  };

  render() {
    const value =
      this.props.value || this.state.model || this.props.defaultValue;
    return (
      <Form
        ref={this.handleFormRefChange}
        value={value}
        {...this.props}
        errors={this.getFormErrors()}
        onChange={this.handleOnFormChange}
        onSubmit={this.handleSubmitForm}
      >
        {this.renderGlobalErrorMessage()}
        {this.renderChildren(this.props.children)}
      </Form>
    );
  }
}

GSForm.propTypes = {
  onSubmit: PropTypes.func
};

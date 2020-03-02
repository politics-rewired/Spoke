import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";

import { ListItem, List } from "material-ui/List";
import ErrorIcon from "material-ui/svg-icons/alert/error";

import theme from "../../../../styles/theme";

const validateSql = sql => {
  const errors = [];
  if (!sql.startsWith("SELECT")) {
    errors.push('Must start with "SELECT" in caps');
  }
  if (
    /LIMIT (\d+)/i.test(sql) &&
    parseInt(sql.match(/LIMIT (\d+)/i)[1], 10) > 10000
  ) {
    errors.push(
      "Spoke currently does not support LIMIT statements of higher than 10000"
    );
  }
  const requiredFields = ["first_name", "last_name", "cell"];
  requiredFields.forEach(f => {
    if (sql.indexOf(f) === -1) {
      errors.push('"' + f + '" is a required column');
    }
  });
  if (sql.indexOf(";") >= 0) {
    errors.push('Do not include a trailing (or any) ";"');
  }

  return errors;
};

const styles = StyleSheet.create({
  csvHeader: {
    fontFamily: "Courier",
    backgroundColor: theme.colors.lightGray,
    padding: 3
  }
});

class ContactsSqlForm extends React.Component {
  state = {
    pendingSql: "",
    sqlError: undefined
  };

  handleSqlTextChange = pendingSql => {
    this.setState({ pendingSql });
    const errors = validateSql(pendingSql);

    if (errors.length > 0) {
      this.setState({ sqlError: errors.join(", ") });
      this.props.onChangeValidSql("");
    } else {
      this.setState({ sqlError: undefined });
      this.props.onChangeValidSql(pendingSql);
    }
  };

  render() {
    const { pendingSql, sqlError } = this.state;
    return (
      <div>
        <div>
          Instead of uploading contacts, as a super-admin, you can also create a
          SQL query directly from the data warehouse that will load in contacts.
          The SQL requires some constraints:
          <ul>
            <li>Start the query with "SELECT"</li>
            <li>Do not include a trailing (or any) semicolon</li>
            <li>
              Three columns are necessary:
              <span className={css(styles.csvHeader)}>first_name</span>,
              <span className={css(styles.csvHeader)}>last_name</span>,
              <span className={css(styles.csvHeader)}>cell</span>,
            </li>
            <li>
              Optional fields are:
              <span className={css(styles.csvHeader)}>zip</span>,
              <span className={css(styles.csvHeader)}>external_id</span>
            </li>
            <li>
              Make sure you make those names exactly possibly requiring an
              <span className={css(styles.csvHeader)}>as field_name</span>{" "}
              sometimes.
            </li>
            <li>Other columns will be added to the customFields</li>
          </ul>
        </div>
        <Form.Field
          name="contactSql"
          type="textarea"
          rows="5"
          value={pendingSql}
          onChange={this.validateSql}
        />
        {sqlError && (
          <List>
            <ListItem
              primaryText={sqlError}
              leftIcon={<ErrorIcon color={theme.colors.red} />}
            />
          </List>
        )}
      </div>
    );
  }
}

ContactsSqlForm.propTypes = {
  onChangeValidSql: PropTypes.func.isRequired
};

export default ContactsSqlForm;

import { Card, CardText, CardTitle } from "material-ui/Card";
import PropTypes from "prop-types";
import React from "react";

const TexterFaqs = ({ faqs }) => {
  return (
    <div>
      <h1>Frequently Asked Questions</h1>
      {faqs.map((faq, idx) => (
        <Card>
          <CardTitle title={`${idx + 1}. ${faq.question}`} />
          <CardText>
            <p>{faq.answer}</p>
          </CardText>
        </Card>
      ))}
    </div>
  );
};

TexterFaqs.propTypes = {
  faqs: PropTypes.array
};

export default TexterFaqs;

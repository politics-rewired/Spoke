import Button from "@material-ui/core/Button";
import {
  useGetCurrentUserProfileQuery,
  useUserAgreeTermsMutation
} from "@spoke/spoke-codegen";
import Divider from "material-ui/Divider";
import Paper from "material-ui/Paper";
import { Step, StepContent, StepLabel, Stepper } from "material-ui/Stepper";
import queryString from "query-string";
import React, { useState } from "react";
import { useHistory, useLocation } from "react-router-dom";

const Terms: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const finished = stepIndex >= 2;

  const history = useHistory();
  const location = useLocation();
  const { data: userProfile } = useGetCurrentUserProfileQuery();
  const [userAgreeTerms] = useUserAgreeTermsMutation();

  const userId = userProfile?.currentUser?.id;

  const handleTermsAgree = async () => {
    if (!userId) return;
    const userData = await userAgreeTerms({
      variables: {
        userId
      }
    });
    if (userData.data?.userAgreeTerms?.terms) {
      const { next } = queryString.parse(location.search);
      if (next && !Array.isArray(next)) {
        history.push(next);
      }
    }
  };

  const handleNext = () => {
    setStepIndex((idx) => idx + 1);
    if (stepIndex >= 2) handleTermsAgree();
  };

  const handlePrev = () => setStepIndex((idx) => Math.max(0, idx - 1));

  const renderStepActions = (step: number) => {
    return (
      <div style={{ margin: "12px 0" }}>
        <Button
          variant="contained"
          color="primary"
          disabled={!userId}
          disableTouchRipple
          disableFocusRipple
          style={{ marginRight: 12 }}
          onClick={handleNext}
        >
          {stepIndex === 2 ? "Agree" : "Next"}
        </Button>
        {step > 0 && (
          <Button
            disabled={stepIndex === 0}
            disableTouchRipple
            disableFocusRipple
            onClick={handlePrev}
          >
            Back
          </Button>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 380, maxHeight: 400, margin: "auto" }}>
      <Paper style={{ padding: 20, margin: 20 }}>
        <h2>Code Of Conduct</h2>
        <Divider />
        <Stepper activeStep={stepIndex} orientation="vertical">
          <Step>
            <StepLabel>
              <div
                style={{
                  marginLeft: "25px",
                  paddingLeft: "21px",
                  marginTop: "-46px"
                }}
              >
                <u>Inappropriate Behaviour</u>
              </div>
            </StepLabel>
            <StepContent>
              <p>
                Occasionally someone might be rude or use inappropriate language
                to you — please don’t engage or respond in kind. We will make
                sure that person isn’t contacted again.
              </p>
              {renderStepActions(0)}
            </StepContent>
          </Step>
          <Step>
            <StepLabel>
              <div
                style={{
                  marginLeft: "25px",
                  paddingLeft: "21px",
                  marginTop: "-46px"
                }}
              >
                <u>Commit to Reply</u>
              </div>
            </StepLabel>
            <StepContent>
              <p>
                Please commit to responding to people who reply to you. We're
                attempting to grow trust and understanding in our community and
                maintaining an open dialogue is key.
              </p>
              {renderStepActions(1)}
            </StepContent>
          </Step>
          <Step>
            <StepLabel>
              <div
                style={{
                  marginLeft: "25px",
                  paddingLeft: "21px",
                  marginTop: "-46px"
                }}
              >
                <u>Retention</u>
              </div>
            </StepLabel>
            <StepContent>
              <p>
                We maintain a record of all conversations with this account.
              </p>
              {renderStepActions(2)}
            </StepContent>
          </Step>
        </Stepper>
        {finished && (
          <p style={{ margin: "20px 0", textAlign: "center" }}>Thanks!</p>
        )}
      </Paper>
    </div>
  );
};

export default Terms;

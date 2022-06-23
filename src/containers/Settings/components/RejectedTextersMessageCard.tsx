import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import React, { useState } from "react";
import * as yup from "yup";

import GSForm from "../../../components/forms/GSForm";
import SpokeFormField from "../../../components/forms/SpokeFormField";

interface RejectedTextersMessageProps {
  showDoNotAssignMessage: boolean;
  doNotAssignMessage: string;
  onToggleShowDoNotAssign(event: React.ChangeEvent, toggled: boolean): void;
  onSaveDoNotAssignMessage(message: string): void;
  style?: React.CSSProperties;
}

const RejectedTextersMessageCard: React.FC<RejectedTextersMessageProps> = (
  props
) => {
  const [doNotAssignMessage, setDoNotAssignMessage] = useState<string>(
    props.doNotAssignMessage
  );

  const doNotAssignSchema = yup.object({
    doNotAssignMessage: yup.string().required()
  });

  const handleSaveDoNotAssignMessage = () =>
    props.onSaveDoNotAssignMessage(doNotAssignMessage);

  const { style, showDoNotAssignMessage, onToggleShowDoNotAssign } = props;

  return (
    <Card style={style}>
      <CardHeader
        titleTypographyProps={{ variant: "body1" }}
        title="Rejected Texters Message"
      />
      <CardContent>
        <FormControlLabel
          label="Show different message when user has do not assign?"
          labelPlacement="start"
          control={
            <Switch
              checked={showDoNotAssignMessage}
              onChange={onToggleShowDoNotAssign}
            />
          }
        />
        {showDoNotAssignMessage ? (
          <GSForm
            schema={doNotAssignSchema}
            value={{
              doNotAssignMessage
            }}
            onChange={({ doNotAssignMessage: newValue }) =>
              setDoNotAssignMessage(newValue)
            }
          >
            <SpokeFormField
              label="Do Not Assign Message"
              name="doNotAssignMessage"
              fullWidth
            />
            <CardActions>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveDoNotAssignMessage}
              >
                Save Do Not Assign Message
              </Button>
            </CardActions>
          </GSForm>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default RejectedTextersMessageCard;

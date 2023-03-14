import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "material-ui/TextField";
import React from "react";
import request from "superagent";

interface SuperAdminLoginProps {
  onLoginComplete(): void;
}

interface SuperAdminLoginState {
  superAdminToken: string;
  superAdminOrgId: string;
  isOpen: boolean;
  isWorking: boolean;
  error?: string;
}

class SuperAdminLogin extends React.Component<
  SuperAdminLoginProps,
  SuperAdminLoginState
> {
  state: SuperAdminLoginState = {
    superAdminToken: "",
    superAdminOrgId: "1",
    isOpen: false,
    isWorking: false,
    error: undefined
  };

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyEvent);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyEvent);
  }

  handleKeyEvent = (e: KeyboardEvent) => {
    // Listen for alt-l keyboard combo
    if (e.keyCode === 76 && e.altKey) {
      this.setState({ isOpen: !this.state.isOpen });
    }
  };

  handleRequestClose = () => this.setState({ isOpen: false });

  handleOnChangeSecret = (
    _event: React.FormEvent<unknown>,
    superAdminToken: string
  ) => this.setState({ superAdminToken });

  handleOnChangeOrgId = (
    _event: React.FormEvent<unknown>,
    superAdminOrgId: string
  ) => this.setState({ superAdminOrgId });

  handleSubmit = async () => {
    const { superAdminToken, superAdminOrgId } = this.state;

    this.setState({ isWorking: true, error: undefined });
    try {
      await request
        .post("/superadmin-login")
        .set("X-Spoke-Superadmin-Token", superAdminToken)
        .send({ organizationId: superAdminOrgId });
      this.setState({ isOpen: false });
      this.props.onLoginComplete();
    } catch (err) {
      if (err.response.status === 403) {
        this.setState({ error: "unauthorized" });
      } else if (err.response.status === 400) {
        this.setState({ error: err.response.body.message });
      } else {
        this.setState({ error: err.message });
      }
    } finally {
      this.setState({ isWorking: false });
    }
  };

  render() {
    const {
      superAdminToken,
      superAdminOrgId,
      isOpen,
      isWorking,
      error
    } = this.state;

    const hasText = superAdminToken.length > 0;

    const actions = [
      <Button
        key="go"
        color="primary"
        disabled={isWorking || !hasText}
        onClick={this.handleSubmit}
      >
        Go
      </Button>
    ];

    return (
      <Dialog open={isOpen} onClose={this.handleRequestClose}>
        <DialogTitle>Superadmin Login</DialogTitle>
        <DialogContent>
          <TextField
            floatingLabelText="Superadmin secret"
            errorText={error}
            type="password"
            value={superAdminToken}
            fullWidth
            onChange={this.handleOnChangeSecret}
          />
          <TextField
            floatingLabelText="Organization ID"
            value={superAdminOrgId}
            onChange={this.handleOnChangeOrgId}
          />
        </DialogContent>
        <DialogActions>{actions}</DialogActions>
      </Dialog>
    );
  }
}

export default SuperAdminLogin;

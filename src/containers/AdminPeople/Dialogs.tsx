import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import FlatButton from "material-ui/FlatButton";
import React from "react";

import OrganizationJoinLink from "../../components/OrganizationJoinLink";
import PasswordResetLink from "../../components/PasswordResetLink";
import { dataTest } from "../../lib/attributes";
import UserEdit from "../UserEdit";

interface EditPersonProps {
  open: boolean;
  afterEditing: () => void;
  organizationId: string;
  userId: string;
}

const EditPerson: React.FC<EditPersonProps> = ({
  open,
  afterEditing,
  organizationId,
  userId
}) => (
  <Dialog {...dataTest("editPersonDialog")} open={open} onClose={afterEditing}>
    <DialogTitle>Edit user</DialogTitle>
    <DialogContent>
      <UserEdit
        organizationId={organizationId}
        userId={userId}
        onRequestClose={afterEditing}
      />
    </DialogContent>
  </Dialog>
);

interface InvitePersonProps {
  organizationUUID: string;
  open: boolean;
  onClose: () => void;
}

const InvitePerson: React.StatelessComponent<InvitePersonProps> = ({
  open,
  onClose,
  organizationUUID
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Invite new texters</DialogTitle>
    <DialogContent>
      <OrganizationJoinLink organizationUuid={organizationUUID} />
    </DialogContent>
    <DialogActions>
      <FlatButton
        key="ok"
        {...dataTest("inviteOk")}
        label="OK"
        primary
        onClick={onClose}
      />
    </DialogActions>
  </Dialog>
);

interface ResetPasswordProps {
  open: boolean;
  onClose: () => void;
  passwordResetHash: string;
}

const ResetPassword: React.StatelessComponent<ResetPasswordProps> = ({
  open,
  onClose,
  passwordResetHash
}) => (
  <div>
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Reset user password</DialogTitle>
      <DialogContent>
        <PasswordResetLink passwordResetHash={passwordResetHash} />
      </DialogContent>
      <DialogActions>
        <FlatButton
          key="ok"
          {...dataTest("passResetOK")}
          label="OK"
          primary
          onClick={onClose}
        />
      </DialogActions>
    </Dialog>
  </div>
);

interface ConfirmSuperAdminProps {
  open: boolean;
  onClose: () => void;
  handleConfirmSuperadmin: () => void;
}

const ConfirmSuperAdmin: React.StatelessComponent<ConfirmSuperAdminProps> = ({
  open,
  onClose,
  handleConfirmSuperadmin
}) => (
  <div>
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Superadmin</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to make this user a Superadmin? Superadmins have
          Owner permissions for all organizations and can manage other
          Superadmins.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <FlatButton
          key="cancel"
          {...dataTest("superAdminOk")}
          label="Cancel"
          primary
          onClick={onClose}
        />
        <FlatButton
          key="ok"
          {...dataTest("superAdminOk")}
          label="Confirm"
          primary
          onClick={handleConfirmSuperadmin}
        />
      </DialogActions>
    </Dialog>
  </div>
);

const Dialogs = {
  InvitePerson,
  EditPerson,
  ResetPassword,
  ConfirmSuperAdmin
};
export default Dialogs;

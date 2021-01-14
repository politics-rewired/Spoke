import { Dialog, FlatButton } from "material-ui";
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

const EditPerson: React.StatelessComponent<EditPersonProps> = ({
  open,
  afterEditing,
  organizationId,
  userId
}) => (
  <Dialog
    {...dataTest("editPersonDialog")}
    title="Edit user"
    modal={false}
    open={open}
    onRequestClose={afterEditing}
  >
    <UserEdit
      organizationId={organizationId}
      userId={userId}
      onRequestClose={afterEditing}
    />
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
  <Dialog
    title="Invite new texters"
    actions={[
      <FlatButton
        key="ok"
        {...dataTest("inviteOk")}
        label="OK"
        primary
        onClick={onClose}
      />
    ]}
    modal={false}
    open={open}
    onRequestClose={onClose}
  >
    <OrganizationJoinLink organizationUuid={organizationUUID} />
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
    <Dialog
      title="Reset user password"
      actions={[
        <FlatButton
          key="ok"
          {...dataTest("passResetOK")}
          label="OK"
          primary
          onClick={onClose}
        />
      ]}
      modal={false}
      open={open}
      onRequestClose={onClose}
    >
      <PasswordResetLink passwordResetHash={passwordResetHash} />
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
    <Dialog
      title="Confirm Superadmin"
      actions={[
        <FlatButton
          key="cancel"
          {...dataTest("superAdminOk")}
          label="Cancel"
          primary
          onClick={onClose}
        />,
        <FlatButton
          key="ok"
          {...dataTest("superAdminOk")}
          label="Confirm"
          primary
          onClick={handleConfirmSuperadmin}
        />
      ]}
      modal={false}
      open={open}
      onRequestClose={onClose}
    >
      Are you sure you want to make this user a Superadmin? Superadmins have
      Owner permissions for all organizations and can manage other Superadmins.
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

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import type { User } from "@spoke/spoke-codegen";
import { useGetPeopleQuery } from "@spoke/spoke-codegen";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";
import React, { useState } from "react";

interface AddSuperAdminDialogProps {
  open: boolean;
  onClose(): void;
  onSubmit(email: string): void;
}

const AddSuperAdminDialog: React.FC<AddSuperAdminDialogProps> = ({
  open,
  onClose,
  onSubmit
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);

  const { data: peopleData, loading } = useGetPeopleQuery();

  const usersData = (peopleData?.people?.users ?? []) as Array<User>;
  const users = usersData.filter((u) => !u.isSuperadmin);

  const handleUserChanged = (
    _event: React.ChangeEvent<unknown>,
    value: User | null
  ) => {
    setUser(value);
  };
  const handleSubmit = () => {
    if (isEmpty(user) || isNil(user)) return;
    setConfirmDialogOpen(false);
    onSubmit(user?.email as string);
    setUser(null);
  };
  const handleConfirmDialogOpen = () => {
    onClose();
    setConfirmDialogOpen(true);
  };
  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
  };

  return (
    <div>
      <Dialog open={open} onClose={onClose} fullWidth>
        <DialogTitle>Add SuperAdmin</DialogTitle>
        {loading ? (
          <DialogContent>
            <DialogContentText>Loading...</DialogContentText>
          </DialogContent>
        ) : (
          <div>
            <DialogContent>
              <DialogContentText>
                Select user to promote to superadmin
              </DialogContentText>
              <Autocomplete
                options={users}
                getOptionLabel={(u) => `${u.displayName} [${u.email}]`}
                value={user}
                onChange={handleUserChanged}
                fullWidth
                renderInput={(params) => (
                  <TextField {...params} label="Pick User" />
                )}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose}>Cancel</Button>
              <Button color="primary" onClick={handleConfirmDialogOpen}>
                Add
              </Button>
            </DialogActions>
          </div>
        )}
      </Dialog>
      <Dialog open={confirmDialogOpen} onClose={handleConfirmDialogClose}>
        <DialogTitle>Confirm add superadmin?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to make this user ({user?.displayName} [
            {user?.email}]) a superadmin?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AddSuperAdminDialog;

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import { useGetPeopleQuery, User } from "@spoke/spoke-codegen";
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
  const [userEmail, setUserEmail] = useState<string | null | undefined>();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);

  const { data: peopleData, loading } = useGetPeopleQuery({
    skip: !open
  });

  const usersData = (peopleData?.people?.users ?? []) as Array<User>;
  const users = usersData.filter((user) => !user.isSuperadmin);

  const handleUserChanged = (event: React.ChangeEvent<{ value: string }>) => {
    setUserEmail(event.target.value);
  };
  const handleSubmit = () => {
    setConfirmDialogOpen(false);
    onSubmit(userEmail as string);
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
      <Dialog open={open} onClose={onClose}>
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
              <FormControl>
                <InputLabel id="add-superadmin-label">Pick User</InputLabel>
                <Select
                  style={{ width: 500 }}
                  labelId="add-superadmin-label"
                  value={userEmail}
                  onChange={handleUserChanged}
                >
                  {users.map((user: User) => (
                    <MenuItem key={user.id} value={user.email}>
                      {user.displayName} [{user.email}]
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            Are you sure you want to make this user ({userEmail}) a superadmin?
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

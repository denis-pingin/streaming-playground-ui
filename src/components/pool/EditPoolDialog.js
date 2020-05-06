import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import TextField from "@material-ui/core/TextField";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import React, {useEffect, useState} from "react";
import {onError} from "../../libs/errorLib";
import Dialog from "@material-ui/core/Dialog";
import {useFormFields} from "../../libs/hooksLib";
import {useMutation} from 'react-apollo';
import {UpdatePoolMutation} from "../../graphql/pool";

export default function EditPoolDialog({open, openStateChanged, pool}) {
  const [isOpen, setIsOpen] = useState(open);
  const [fields, handleFieldChange] = useFormFields({
    name: pool.name
  });
  const [updatePoolName, { loading }] = useMutation(UpdatePoolMutation);

  useEffect(() => {
    function init() {
      setIsOpen(open);
    }
    init();
  });

  function validateForm() {
    return fields.name.length >= 3;
  }

  async function handleUpdatePool(event) {
    event.preventDefault();
    try {
      updatePoolName({
        variables: {
          poolId: pool.poolId,
          name: fields.name
        }
      });
      handleClose();
    } catch (e) {
      onError(e);
    }
  }

  function handleClose() {
    setIsOpen(false);
    openStateChanged(false);
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} aria-labelledby="form-dialog-title">
      <form noValidate onSubmit={handleUpdatePool}>
        <DialogTitle id="form-dialog-title">Edit pool settings</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Pool name"
            type="text"
            fullWidth
            value={fields.name}
            onChange={handleFieldChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            disabled={loading || !validateForm()}
          >
            OK
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
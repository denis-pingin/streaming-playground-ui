import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import TextField from "@material-ui/core/TextField";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import React, {useEffect, useState} from "react";
import {onError} from "../../libs/errorLib";
import Dialog from "@material-ui/core/Dialog";
import {useFormFields} from "../../libs/hooksLib";
import {useHistory} from "react-router-dom";
import {useSnackbar} from "notistack";
import {useMutation} from 'react-apollo';
import {CreatePoolMutation} from "../../graphql/pool";

export default function NewPoolDialog({open, openStateChanged}) {
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(open);
  const [fields, handleFieldChange] = useFormFields({
    name: ""
  });
  const {enqueueSnackbar} = useSnackbar();
  const [createPool, { loading }] = useMutation(CreatePoolMutation, {
    onCompleted: (data) => {
      console.log("Pool created:", data);
      enqueueSnackbar(`Pool ${data.createPool.name} created`, 'success');
      history.push(`/pools/${data.createPool.poolId}`);
    }
  });

  useEffect(() => {
    function init() {
      setIsOpen(open);
    }

    init();
  });

  function validateForm() {
    return fields.name.length >= 3;
  }

  async function handleCreatePool(event) {
    event.preventDefault();
    try {
      createPool({
        variables: {
          name: fields.name
        }
      });
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
      <form noValidate onSubmit={handleCreatePool}>
        <DialogTitle id="form-dialog-title">Create a new pool</DialogTitle>
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
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
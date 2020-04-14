import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import TextField from "@material-ui/core/TextField";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import React, {useEffect, useState} from "react";
import {onError} from "../libs/errorLib";
import Dialog from "@material-ui/core/Dialog";
import {API} from "aws-amplify";
import {useFormFields} from "../libs/hooksLib";
import {useHistory} from "react-router-dom";

export default function NewPoolDialog({open, openStateChanged}) {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(open);
  const [fields, handleFieldChange] = useFormFields({
    name: ""
  });

  useEffect(() => {
    function init() {
      setIsOpen(open);
    }

    init();
  });

  function validateForm() {
    return fields.name.length > 3;
  }

  async function createPool(name) {
    return API.post("pools", "/", {
      body: {
        name: name
      }
    });
  }

  async function handleCreatePool(event) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const pool = await createPool(fields.name);
      history.push(`/pools/${pool.poolId}`);
    } catch (e) {
      onError(e);
    }
    setIsLoading(false);
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
            disabled={!validateForm()}
          >
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
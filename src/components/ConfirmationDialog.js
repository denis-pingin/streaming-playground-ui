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
import DialogContentText from "@material-ui/core/DialogContentText";

export default function ConfirmationDialog({title, text, result}) {
  const handleReject = () => {
    result(false);
  };

  const handleConfirm = () => {
    result(true);
  };

  return (
    <Dialog
      open={true}
      onClose={handleReject}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">{text}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReject} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="primary" autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
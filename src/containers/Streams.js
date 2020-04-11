import React, { useRef, useState, useEffect } from "react";
import { API, Storage } from "aws-amplify";
import { useParams, useHistory } from "react-router-dom";
import {FormGroup, FormControl, ControlLabel, ListGroupItem} from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import { onError } from "../libs/errorLib";
import { s3Upload } from "../libs/awsLib";
import config from "../config";
import "./Streams.css";
import {LinkContainer} from "react-router-bootstrap";

export default function Streams() {
  const file = useRef(null);
  const { id } = useParams();
  const history = useHistory();
  const [stream, setStream] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    function loadStream() {
      return API.get("streams", `/streams/${id}`);
    }

    async function onLoad() {
      try {
        const stream = await loadStream();
        setStream(stream);
      } catch (e) {
        onError(e);
      }
    }

    onLoad();
  }, [id]);

  function validateForm() {
    return true;
  }

  function formatFilename(str) {
    return str.replace(/^\w+-/, "");
  }

  function handleFileChange(event) {
    file.current = event.target.files[0];
  }

  function saveStream(stream) {
    return API.put("streams", `/streams/${id}`, {
      body: stream
    });
  }

  async function handleSubmit(event) {
    // let attachment;

    event.preventDefault();

    // if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
    //   alert(
    //     `Please pick a file smaller than ${
    //       config.MAX_ATTACHMENT_SIZE / 1000000
    //     } MB.`
    //   );
    //   return;
    // }

    setIsLoading(true);

    try {
      // if (file.current) {
      //   attachment = await s3Upload(file.current);
      // }

      await saveStream({});
      history.push("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  function deleteStream() {
    return API.del("streams", `/streams/${id}`);
  }

  async function handleDelete(event) {
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to delete this stream?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteStream();
      history.push("/");
    } catch (e) {
      onError(e);
      setIsDeleting(false);
    }
  }

  return (
    <div className="Streams">
      {stream && (
        <div>
          <ListGroupItem header={stream.streamId}>
            {"Created: " + new Date(stream.createdAt).toLocaleString()}
          </ListGroupItem>
          <form onSubmit={handleSubmit}>
            <LoaderButton
              block
              type="submit"
              bsSize="large"
              bsStyle="primary"
              isLoading={isLoading}
              disabled={!validateForm()}
            >
              Save
            </LoaderButton>
            <LoaderButton
              block
              bsSize="large"
              bsStyle="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete
            </LoaderButton>
          </form>
        </div>
      )}
    </div>
  );
}

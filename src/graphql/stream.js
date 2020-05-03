import gql from "graphql-tag";

export const STREAMING_STARTED_SUBSCRIPTION = gql`
  subscription StreamingStartedSubscription($poolId: String!) {
    streamingStarted(poolId: $poolId) {
      streamId
      openTokStreamId
      name
      createdAt
      updatedAt
    }
  }
`;

export const STREAMING_STOPPED_SUBSCRIPTION = gql`
  subscription StreamingStoppedSubscription($poolId: String!) {
    streamingStopped(poolId: $poolId) {
      streamId
      openTokStreamId
      name
      createdAt
      updatedAt
    }
  }
`;

export const STREAM_UPDATED_SUBSCRIPTION = gql`
  subscription StreamUpdatedSubscription($poolId: String!) {
    streamUpdated(poolId: $poolId) {
      streamId
      openTokStreamId
      name
      createdAt
      updatedAt
    }
  }
`;

export const START_STREAMING_MUTATION = gql`
  mutation StartStreaming($poolId: String!, $name: String!) {
    startStreaming(poolId: $poolId, name: $name) {
      poolId
      streamId
      name
    }
  }
`;
export const STOP_STREAMING_MUTATION = gql`
  mutation StopStreaming($poolId: String!, $streamId: String!) {
    stopStreaming(poolId: $poolId, streamId: $streamId) {
      poolId
      streamId
      name
    }
  }
`;
export const UPDATE_STREAM_OPEN_TOK_STREAM_ID_MUTATION = gql`
  mutation UpdateStreamOpenTokStreamId($poolId: String!, $streamId: String!, $openTokStreamId: String!) {
    updateStreamOpenTokStreamId(poolId: $poolId, streamId: $streamId, openTokStreamId: $openTokStreamId) {
      poolId
      streamId
      name
    }
  }
`;
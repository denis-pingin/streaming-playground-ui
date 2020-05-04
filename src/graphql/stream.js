import gql from "graphql-tag";

export const StartStreamingMutation = gql`
  mutation StartStreaming($poolId: String!, $name: String!) {
    startStreaming(poolId: $poolId, name: $name) {
      poolId
      streamId
      name
    }
  }
`;
export const StopStreamingMutation = gql`
  mutation StopStreaming($poolId: String!, $streamId: String!) {
    stopStreaming(poolId: $poolId, streamId: $streamId) {
      poolId
      streamId
      name
    }
  }
`;
export const UpdateStreamOpenTokStreamIdMutation = gql`
  mutation UpdateStreamOpenTokStreamId($poolId: String!, $streamId: String!, $openTokStreamId: String!) {
    updateStreamOpenTokStreamId(poolId: $poolId, streamId: $streamId, openTokStreamId: $openTokStreamId) {
      poolId
      streamId
      name
    }
  }
`;

export const StreamingStartedSubscription = gql`
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

export const StreamingStoppedSubscription = gql`
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

export const StreamUpdatedSubscription = gql`
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

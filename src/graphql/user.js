import gql from "graphql-tag";

export const STREAMING_STATUS_UPDATED_SUBSCRIPTION = gql`
  subscription StreamingStatusUpdatedSubscription($userId: String!) {
    streamingStatusUpdated(userId: $userId) {
      streaming
      streamId
      openTokToken
    }
  }
`;

import gql from "graphql-tag";

export const StreamingStatusUpdatedSubscription = gql`
  subscription StreamingStatusUpdatedSubscription($userId: String!) {
    streamingStatusUpdated(userId: $userId) {
      streaming
      streamId
      openTokToken
    }
  }
`;

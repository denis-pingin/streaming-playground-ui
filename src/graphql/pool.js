import gql from "graphql-tag";

export const GetPoolsQuery = gql`
  query PoolsQuery {
    pools {
      poolId
      name
      createdAt,
      updatedAt,
      streams {
        streamId
        openTokStreamId
        name
        createdAt
        updatedAt
      }
    }
  }
`;

export const GetPoolQuery = gql`
  query Pool($poolId: String!) {
    pool(poolId: $poolId) {
      poolId
      ownerUserId
      name
      streams {
        streamId
        openTokStreamId
        name
        createdAt
        updatedAt
      }
      openTokSessionConfig {
        apiKey
        sessionId
        openTokToken
      }
      createdAt
      updatedAt
    }
  }
`;

export const CreatePoolMutation = gql`
  mutation CreatePool($name: String!) {
    createPool(name: $name) {
      poolId
      name
      streams {
        streamId
        openTokStreamId
        name
        createdAt
        updatedAt
      }
    }
  }
`;

export const UpdatePoolMutation = gql`
  mutation UpdatePool($poolId: String!, $name: String!) {
    updatePool(poolId: $poolId, name: $name) {
      poolId
      name
      streams {
        streamId
        openTokStreamId
        name
        createdAt
        updatedAt
      }
    }
  }
`;

export const DeletePoolMutation = gql`
  mutation DeletePool($poolId: String!) {
    deletePool(poolId: $poolId) {
      poolId
      name
      streams {
        streamId
        openTokStreamId
        name
        createdAt
        updatedAt
      }
    }
  }
`;

export const PoolCreatedSubscription = gql`
  subscription PoolCreatedSubscription {
    poolCreated {
      poolId
      ownerUserId
      name
      createdAt,
      updatedAt,
      streams {
        streamId
        openTokStreamId
        name
        createdAt
        updatedAt
      }
      openTokSessionConfig {
        apiKey
        sessionId
        openTokToken
      }
    }
  }
`;

export const PoolUpdatedSubscription = gql`
  subscription PoolUpdatedSubscription {
    poolUpdated {
      poolId
      ownerUserId
      name
      createdAt,
      updatedAt,
      streams {
        streamId
        openTokStreamId
        name
        createdAt
        updatedAt
      }
      openTokSessionConfig {
        apiKey
        sessionId
        openTokToken
      }
    }
  }
`;

export const PoolDeletedSubscription = gql`
  subscription PoolDeletedSubscription {
    poolDeleted {
      poolId
      ownerUserId
      name
      createdAt,
      updatedAt,
      streams {
        streamId
        openTokStreamId
        name
        createdAt
        updatedAt
      }
      openTokSessionConfig {
        apiKey
        sessionId
        openTokToken
      }
    }
  }
`;
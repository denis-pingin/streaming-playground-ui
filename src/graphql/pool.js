import gql from "graphql-tag";

export const POOLS_QUERY = gql`
  query PoolsQuery {
    pools {
      poolId
      name
      createdAt,
      updatedAt,
      streams {
        streamId
        name
      }
    }
  }
`;

export const POOL_QUERY = gql`
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
    profile {
      streamingStatus {
        streaming
        streamId
      }
    }
  }
`;

export const CREATE_POOL_MUTATION = gql`
  mutation CreatePool($name: String!) {
    createPool(name: $name) {
      poolId
      name
      streams {
        streamId
        name
      }
    }
  }
`;

export const UPDATE_POOL_MUTATION = gql`
  mutation UpdatePool($poolId: String!, $name: String!) {
    updatePool(poolId: $poolId, name: $name) {
      poolId
      name
      streams {
        streamId
        name
      }
    }
  }
`;

export const DELETE_POOL_MUTATION = gql`
  mutation DeletePool($poolId: String!) {
    deletePool(poolId: $poolId) {
      poolId
      name
      streams {
        streamId
        name
      }
    }
  }
`;

export const POOL_CREATED_SUBSCRIPTION = gql`
  subscription PoolCreatedSubscription {
    poolCreated {
      poolId
      name
      createdAt,
      updatedAt,
      streams {
        streamId
        name
      }
    }
  }
`;

export const POOL_UPDATED_SUBSCRIPTION = gql`
  subscription PoolUpdatedSubscription {
    poolUpdated {
      poolId
      name
      createdAt,
      updatedAt,
      streams {
        streamId
        name
      }
    }
  }
`;

export const POOL_DELETED_SUBSCRIPTION = gql`
  subscription PoolDeletedSubscription {
    poolDeleted {
      poolId
      name
      createdAt,
      updatedAt,
      streams {
        streamId
        name
      }
    }
  }
`;
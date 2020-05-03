import React, {useEffect, useState} from "react";
import {Link as RouterLink} from "react-router-dom";
import {useAuthContext} from "../contexts/AuthContext";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Container from "@material-ui/core/Container";
import Fab from "@material-ui/core/Fab";
import AddIcon from '@material-ui/icons/Add';
import makeStyles from "@material-ui/core/styles/makeStyles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Link from "@material-ui/core/Link";
import NewPoolDialog from "../components/NewPoolDialog";
import {useQuery} from 'react-apollo';
import Loading from "../components/Loading";
import Error from "../components/Error";
import {
  POOL_CREATED_SUBSCRIPTION,
  POOL_DELETED_SUBSCRIPTION,
  POOL_UPDATED_SUBSCRIPTION,
  POOLS_QUERY
} from "../graphql/pool"

const useStyles = makeStyles((theme) => ({
  card: {
    height: "100%"
  }
}));

export default function Pools() {
  const classes = useStyles();
  const {isAuthenticated} = useAuthContext();
  const [newPoolDialogOpen, setNewPoolDialogOpen] = useState(false);
  const {loading, error, data, subscribeToMore} = useQuery(POOLS_QUERY, {
    skip: !isAuthenticated()
  });

  useEffect(() => {
    subscribeToMore({
      document: POOL_CREATED_SUBSCRIPTION,
      updateQuery: (prevData, { subscriptionData }) => {
        console.log("POOL_CREATED_SUBSCRIPTION", prevData, subscriptionData)
        if (!subscriptionData.data) {
          return prevData;
        }
        const pool = subscriptionData.data.poolCreated;
        const pools = [...prevData.pools, pool];
        return {
          pools: pools
        };
      }
    });
    subscribeToMore({
      document: POOL_UPDATED_SUBSCRIPTION,
      updateQuery: (prevData, { subscriptionData }) => {
        console.log("POOL_UPDATED_SUBSCRIPTION", prevData, subscriptionData)
        if (!subscriptionData.data) {
          return prevData;
        }
        const pool = subscriptionData.data.poolUpdated;
        return {
          pools: prevData.pools.map(item=> item.poolId == pool.poolId ? pool : item)
        };
      }
    });
    subscribeToMore({
      document: POOL_DELETED_SUBSCRIPTION,
      updateQuery: (prevData, { subscriptionData }) => {
        console.log("POOL_DELETED_SUBSCRIPTION", prevData, subscriptionData)
        if (!subscriptionData.data) {
          return prevData;
        }
        const pool = subscriptionData.data.poolDeleted;
        return {
          pools: prevData.pools.filter(item => item.poolId !== pool.poolId)
        };
      }
    })
  }, []);

  async function handleCreatePool(event) {
    setNewPoolDialogOpen(true);
  }

  function renderPoolsList(pools) {
    return (
      <Grid container spacing={3} alignItems="stretch">
        {pools.map(pool =>
          (
            <Grid item key={pool.poolId} xs={12} sm={6} md={4} lg={3} xl={2}>
              <Card className={classes.card}>
                <Link component={RouterLink} to={`/pools/${pool.poolId}`} underline="none">
                  <CardContent>
                    <Typography component="h1" variant="h5" color="textPrimary" gutterBottom>
                      {pool.name}
                    </Typography>
                    <Typography component="h1" variant="h6" color="textSecondary">
                      {"Streams: " + pool.streams.length}
                    </Typography>
                    <Typography component="h1" variant="h6" color="textSecondary">
                      {"Created: " + new Date(pool.createdAt).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Link>
              </Card>
            </Grid>
          )
        )}
      </Grid>
    );
  }

  return (
    <Container component="main" maxWidth="xl">
      {newPoolDialogOpen && <NewPoolDialog open={newPoolDialogOpen} openStateChanged={setNewPoolDialogOpen}/>}
      <Grid container spacing={3}>
        <Grid item>
          <Fab color="primary"
               aria-label="add"
               size="medium"
               onClick={handleCreatePool}
               disabled={loading}>
            <AddIcon/>
          </Fab>
        </Grid>
        <Grid item>
          <Typography component="h1" variant="h3" color="textPrimary">
            Pools
          </Typography>
        </Grid>
      </Grid>
      {loading && <Loading/>}
      {!loading && error && <Error error={error}/>}
      {!loading && !error && data.pools && renderPoolsList(data.pools)}
    </Container>
  );
}

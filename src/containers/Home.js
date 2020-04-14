import React, {useEffect, useState} from "react";
import {API} from "aws-amplify";
import {Link as RouterLink, useHistory} from "react-router-dom";
import {onError} from "../libs/errorLib";
import {useAuthContext} from "../libs/AuthContext";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Container from "@material-ui/core/Container";
import {Button, ButtonGroup} from "@material-ui/core";
import Fab from "@material-ui/core/Fab";
import AddIcon from '@material-ui/icons/Add';
import makeStyles from "@material-ui/core/styles/makeStyles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Link from "@material-ui/core/Link";

const useStyles = makeStyles((theme) => ({
  card: {
    minWidth: 275,
  }
}));

export default function Home() {
  const classes = useStyles();
  const history = useHistory();
  const [pools, setPools] = useState([]);
  const {isAuthenticated} = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticated) {
        return;
      }

      try {
        const pools = await loadPools();
        setPools(pools);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, [isAuthenticated]);

  async function createPool() {
    return API.post("pools", "/", {
      body: {
        name: "My pool"
      }
    });
  }

  async function loadPools() {
    return API.get("pools", "/");
  }

  async function handleCreatePool(event) {
    event.preventDefault()
    setIsLoading(true);
    try {
      const pool = await createPool();
      history.push(`/pools/${pool.poolId}`);
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  function renderPoolsList(pools) {
    return pools.map((pool, i) =>
      (
        <Grid item key={pool.poolId}>
          <Card className={classes.card}>
            <Link component={RouterLink} to={`/pools/${pool.poolId}`} underline="none">
              <CardContent>
                <Typography color="textPrimary" variant="h5" gutterBottom>
                  {pool.name}
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  {"Created: " + new Date(pool.createdAt).toLocaleString()}
                </Typography>
              </CardContent>
            </Link>
          </Card>
        </Grid>
      )
    );
  }

  function renderLander() {
    return (
      <Container component="main" maxWidth="sm">
        <Typography component="h1" variant="h4" align="center">
          Streaming Playground
        </Typography>
        <Typography component="h1" variant="h6" align="center">
          Let's play!
        </Typography>
        <ButtonGroup variant="outlined" fullWidth={true}>
          <Button component={RouterLink} to="/login">Login</Button>
          <Button component={RouterLink} to="/signup">Sign Up</Button>
        </ButtonGroup>
      </Container>
    );
  }

  function renderPools() {
    return (
      <Container component="main" maxWidth="xl">
        <Grid container spacing={3}>
          <Grid item>
            <Fab color="primary"
                 aria-label="add"
                 size="medium"
                 onClick={handleCreatePool}
                 disabled={isLoading}>
              <AddIcon/>
            </Fab>
          </Grid>
          <Grid item>
            <Typography variant="h3">
              Pools
            </Typography>
          </Grid>
        </Grid>
        {pools && <Grid container spacing={3}>
          {renderPoolsList(pools)}
        </Grid>}
      </Container>
    );
  }

  return (
    <div className="Home">
      {isAuthenticated ? renderPools() : renderLander()}
    </div>
  );
}

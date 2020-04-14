import React, {useEffect, useState} from "react";
import {API} from "aws-amplify";
import {Link as RouterLink, useHistory} from "react-router-dom";
import {onError} from "../libs/errorLib";
import {useAuthContext} from "../contexts/AuthContext";
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
import NewPoolDialog from "../components/NewPoolDialog";

const useStyles = makeStyles((theme) => ({
  card: {
    height: "100%"
  }
}));

export default function Home() {
  const classes = useStyles();
  const [pools, setPools] = useState([]);
  const {isAuthenticated} = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [newPoolDialogOpen, setNewPoolDialogOpen] = useState(false);

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

  async function loadPools() {
    return API.get("pools", "/");
  }

  async function handleCreatePool(event) {
    setNewPoolDialogOpen(true);
  }

  function renderPoolsList(pools) {
    return pools.map((pool, i) =>
      (
        <Grid item key={pool.poolId} xs={12} sm={6} md={4} lg={3} xl={2}>
          <Card className={classes.card}>
            <Link component={RouterLink} to={`/pools/${pool.poolId}`} underline="none">
              <CardContent>
                <Typography component="h1" variant="h5" color="textPrimary" gutterBottom>
                  {pool.name}
                </Typography>
                <Typography component="h1" variant="h6" color="textSecondary">
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
        <Typography component="h1" variant="h4" align="center" color="textPrimary">
          Streaming Playground
        </Typography>
        <Typography component="h1" variant="h6" align="center" color="textSecondary">
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
        {newPoolDialogOpen && <NewPoolDialog open={newPoolDialogOpen} openStateChanged={setNewPoolDialogOpen}/>}
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
            <Typography component="h1" variant="h3" color="textPrimary">
              Pools
            </Typography>
          </Grid>
        </Grid>
        {pools && <Grid container spacing={3} alignItems="stretch">
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

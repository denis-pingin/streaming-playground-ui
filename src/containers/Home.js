import React, {useContext, useEffect, useState} from "react";
import {API} from "aws-amplify";
import {Link, useHistory} from "react-router-dom";
import {LinkContainer} from "react-router-bootstrap";
import {ListGroup, ListGroupItem, PageHeader} from "react-bootstrap";
import {onError} from "../libs/errorLib";
import "./Home.css";
import LoaderButton from "../components/LoaderButton";
import {IconContext} from "react-icons";
import {FaPlus} from "react-icons/all";
import {useAuthContext} from "../libs/AuthContext";

export default function Home() {
  const history = useHistory();
  const [pools, setPools] = useState([]);
  const { isAuthenticated } = useAuthContext();
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
        name: "My awesome pool"
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
        <LinkContainer key={pool.poolId} to={`/pools/${pool.poolId}`}>
          <ListGroupItem header={pool.name}>
            {"Created: " + new Date(pool.createdAt).toLocaleString()}
          </ListGroupItem>
        </LinkContainer>
      )
    );
  }

  function renderLander() {
    return (
      <div className="lander">
        <h1>Streaming playground</h1>
        <p>Let's play!</p>
        <div>
          <Link to="/login" className="btn btn-info btn-lg">
            Login
          </Link>
          <Link to="/signup" className="btn btn-success btn-lg">
            Signup
          </Link>
        </div>
      </div>
    );
  }

  function renderPools() {
    return (
      <div className="pools">
        <IconContext.Provider value={{size: "2em"}}>
          <PageHeader>
            <span>Pools</span>
            <LoaderButton
              className="icon-button"
              onClick={handleCreatePool}
              disabled={isLoading}>
              <FaPlus/>
            </LoaderButton>
          </PageHeader>
          <ListGroup>
            {!isLoading && renderPoolsList(pools)}
          </ListGroup>
        </IconContext.Provider>
      </div>
    );
  }

  return (
    <div className="Home">
      {isAuthenticated ? renderPools() : renderLander()}
    </div>
  );
}

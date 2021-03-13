import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

import './main.css'

//Importing pages
import Home from './home';
import SingleAngleSectionWithBoltedConnections from './SingleAngleSectionWithBoltedConnections';
import SingleAngleSectionWithWeldedConnections from './SingleAngleSectionWithWeldedConnections';
import TwoAngleSectionOnSameSide from './TwoAngleSectionOnSameSide';
import TwoAngleSectionOnOppoSide from './TwoAngleSectionOnOppoSide';

function Main() {
  return (
    <Router >
      <Switch>
        <Route path="/" exact>
            <Home />
        </Route>
        <Route path="/SingleAngleSectionWithBoltedConnections">
            <SingleAngleSectionWithBoltedConnections />
        </Route>
        <Route path="/SingleAngleSectionWithWeldedConnections">
            <SingleAngleSectionWithWeldedConnections />
        </Route>
        <Route path="/TwoAngleSectionOnSameSide">
            <TwoAngleSectionOnSameSide />
        </Route>
        <Route path="/TwoAngleSectionOnOppoSide">
            <TwoAngleSectionOnOppoSide />
        </Route>
        <Route path="*">
            <h2>Ooops... Page Doesnt Exist</h2>
        </Route>
      </Switch>
    </Router>
  );
}

export default Main;
import React from 'react';
import ReactDOM from 'react-dom';

import {Link} from 'react-router-dom';

import './main.css'

function Home() {
  return (
    <div >
        <style>{'body {background-color: black;}'}</style>
        <p 
            className='heading_light'
            style = {{position:'absolute', top:'-70px', left:'45px'}}>Design of
        </p>
        <p 
            className='heading_medium'
            style = {{position:'absolute', top:'15px', left:'45px'}}>TENSION 
        </p>
        <p 
            className='heading_medium'
            style = {{position:'absolute', top:'110px', left:'45px'}}>MEMBERS
        </p>
        <p>
            <Link 
                className='btn'
                to='/SingleAngleSectionWithBoltedConnections'
                style={{ textDecoration: 'none', position:'absolute', bottom:'325px', left:'50px' }}>
                    Single angle section with bolted connections</Link>
        </p>
        <p>
            <Link 
                className='btn'
                to='/SingleAngleSectionWithWeldedConnections'
                style={{ textDecoration: 'none', position: 'absolute', bottom:'240px', left:'50px' }}>
                    Single angle section with wleded connections</Link>
        </p>
        <p>
              <Link 
                className='btn'
                to='/TwoAngleSectionOnSameSide'
                style={{ textDecoration: 'none', position: 'absolute', bottom:'155px', left:'50px' }}>
                    Two angle section placed back to back on same side of gusset plate</Link>
        </p>
        <p>
              <Link 
                className='btn'
                to='/TwoAngleSectionOnOppoSide'
                style={{ textDecoration: 'none', position: 'absolute', bottom:'70px', left:'50px' }}>
                    Two angle section placed back to back on opposite side of gusset plate</Link>
          </p>
    </div>
  );
}

export default Home;
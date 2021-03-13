import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

import {Link} from 'react-router-dom';
import home from './imgANDfonts/home.png';
import cancel from './imgANDfonts/cancel.png';

import Modal from 'react-modal';
import './main.css';
import './style.css';
import './data/unequal_angles.json';

function find_alpha( no_of_bolts ){
  if( no_of_bolts<=2 && no_of_bolts>0 ){
    return 0.6;
  }
  else if( no_of_bolts == 3 ){
    return 0.7;
  }
  else{
    return 0.8;
  }
}

var output = {
    min_area_required : undefined,
    shear_StrngthBolt : undefined,
    bearing_StrengthBolt : undefined,
    NoOfBolts : undefined,
    strength_due_to_yeilding : undefined,
    strength_due_to_rupture : undefined,
    block_shear : undefined,
    design_tensile_strength_of_angle : undefined,
    name:undefined
};

function make_design(input, output){
  /*---------------------Importing the data relevent to ISA angles------------------------*/
  let unequal_angles = require('./data/unequal_angles.json');
  let equal_angles = require('./data/equal_angles.json');
  
  /*---------------------Fetching the Input------------------------*/
  let FactoredLoad = parseFloat(input.factoredLoad)*1000;
  let LengthOfTensionMember = parseFloat(input.lengthOfTM);
  let AllowableSlendernessRatio = parseFloat(input.allowableSR);
  let UltimateStressOfSteel = parseFloat(input.uStressSteel);
  let YeildStressOfSteel = parseFloat(input.yStressSteel);
  let PSF_UltimateStress = parseFloat(input.pSF_US);
  let PSF_Yeilding = parseFloat(input.pSF_YS);
  let UltimateStrengthOfBolt = parseFloat(input.uStrengthBolt);
  let DiameterOfBolt = parseFloat(input.diameterBolt);
  let Pitch = parseFloat(input.pitch);
  let EndDistance = parseFloat(input.editDistance);
  let PSF_ForBolt = parseFloat(input.pSF_Bolt);
  let DiameterOfHole = DiameterOfBolt+2;

  let size = (input.equalORunequal)?(72):(65);
  /*---------------------The Design Algorithm------------------------*/
  /*---------------------Min. Area Required------------------------*/
  let minAreaRequired = (FactoredLoad*PSF_Yeilding)/(YeildStressOfSteel);
  console.log("Minimum Area Required : ", minAreaRequired, " sq.mm");
  output.min_area_required = minAreaRequired;

  /*---------------------General Variables------------------------*/
  let count = 0;
  let isDone = false;
  for( let i=0;i<size;i++ ){
    let AreaOfAngle = undefined;
    let AngleLength = undefined;
    let AngleWidth = undefined;
    let AngleThickness = undefined;
    let CenterOfGravity_Cxx = undefined;
    let AngleRGyration = undefined;
    let AngleName = undefined;
    if( !input.equalORunequal ){
      AreaOfAngle = (unequal_angles[i].area)*(100);
      AngleLength = unequal_angles[i].Length;
      AngleWidth = unequal_angles[i].Width;
      AngleThickness = unequal_angles[i].thickness;
      CenterOfGravity_Cxx = unequal_angles[i].Cxx * 10;
      AngleRGyration = unequal_angles[i].rzz * 10;      //Radius Gyration
      AngleName = unequal_angles[i].name;
    }
    else{
      AreaOfAngle = (equal_angles[i].area)*(100);
      AngleLength = equal_angles[i].Length;
      AngleWidth = equal_angles[i].Width;
      AngleThickness = equal_angles[i].thickness;
      CenterOfGravity_Cxx = equal_angles[i].Cxx * 10;
      AngleRGyration = equal_angles[i].rzz * 10;        //Radius Gyration
      AngleName = equal_angles[i].name;
    }

    if( (2*AreaOfAngle) >= minAreaRequired ){
      count++;
      console.log('Test case ', count, " ---------------------------------_");//printing the information in console
      console.log("Area of Angle : ", AreaOfAngle, " sq.mm");   
      
      /*---------------------Shear Strength of Bolt------------------------*/
      let CrossSection_area = ((0.78)*(3.14)*(DiameterOfBolt*DiameterOfBolt))/4;//mm2
      let shear_strength_bolt = (UltimateStrengthOfBolt*CrossSection_area)/(1.73*PSF_ForBolt);//N
      output.shear_StrngthBolt = shear_strength_bolt;
      
      console.log("Net Tensile area of Bolt : ", CrossSection_area, " sq.mm");     //printing the information in console
      console.log("Shear Strength of Bolt : ", shear_strength_bolt/1000, "kN");    //printing the information in console
      
      /*---------------------Bearing Strength Bolt------------------------*/
      let Kb = Math.min(((EndDistance)/(3*DiameterOfHole)), ((Pitch/(3*DiameterOfHole)) - 0.25), (UltimateStrengthOfBolt/UltimateStressOfSteel), (1));//UnitLess
      let bearing_strength_bolt = (2.5*Kb*DiameterOfBolt*UltimateStrengthOfBolt*(AngleThickness)/PSF_ForBolt);//N
      output.bearing_StrengthBolt = bearing_strength_bolt;
      
      console.log("Kb : ", Kb);                                                        //printing the information in console
      console.log("Bearing Strength of Bolt : ", bearing_strength_bolt/1000, " kN");   //printing the information in console
      
      /*---------------------No. of Bolts------------------------*/
      let no_of_bolts = Math.ceil( (FactoredLoad)/(Math.min(shear_strength_bolt, bearing_strength_bolt)) );//UnitLess
      let no_of_bolts_for_one_section = (no_of_bolts%2 == 0)?(no_of_bolts/2):((no_of_bolts+1)/2);
      let alpha_for_one_section = find_alpha(no_of_bolts_for_one_section);
      output.NoOfBolts = no_of_bolts_for_one_section;
      
      console.log("Number of Bolts Required : ", no_of_bolts);  //printing the information in console
      
      /*---------------------Design Strength due to Yielding------------------------*/
      let Tdg = 2*(YeildStressOfSteel*AreaOfAngle)/(PSF_Yeilding);
      output.strength_due_to_yeilding = Tdg;
      
      console.log("Design Strength due to Yielding : ", Tdg/1000, " kN");   //printing the information in console

      /*---------------------Design Strength Due to Rupture------------------------*/
      let Anc = (AngleLength-(AngleThickness/2)-(DiameterOfHole))*AngleThickness;
      let Ago = (AngleWidth-(AngleThickness/2))*AngleThickness;
      let An = Anc+Ago;
      
      let Tdn = 2*(UltimateStressOfSteel*An*alpha_for_one_section)/(PSF_UltimateStress);
      output.strength_due_to_rupture = Tdn;
      
      console.log("Anc : ", Anc, " sq.mm");                                //printing the information in console
      console.log("Ago : ", Ago, " sq.mm");                                //printing the information in console
      console.log("An : ", An, " sq.mm");                                  //printing the information in console
      console.log("Design Strength Due to Rupture : ", Tdn/1000, " kN");   //printing the information in console

      /*---------------------Design Strength due to Block Shear------------------------*/
      let g = Math.ceil( (AngleLength - AngleThickness)/2 );
      let p = AngleLength - g;
      let Avg = ((no_of_bolts_for_one_section-1)*(Pitch) + (EndDistance))*(AngleThickness);//mm2
      let Avn = ((no_of_bolts_for_one_section-1)*(Pitch) + (EndDistance) - (no_of_bolts_for_one_section-0.5)*(DiameterOfHole))*(AngleThickness);//mm2
      let Atg = (p)*(AngleThickness);
      let Atn = (p - (0.5*DiameterOfHole))*(AngleThickness);

      let Tdb1 = 2*( (0.9*Avn*UltimateStressOfSteel)/(1.73*PSF_UltimateStress) )+( (Atg*YeildStressOfSteel)/(PSF_Yeilding) );
      let Tdb2 = 2*( (Avg*YeildStressOfSteel)/(1.73*PSF_Yeilding) )+( (0.9*Atn*UltimateStressOfSteel)/(PSF_UltimateStress) );

      let Tdb = Math.min(Tdb1, Tdb2);
      output.block_shear = Tdb;
      
      console.log("Avg : ", Avg, " sq.mm");                                                                     //printing the information in console
      console.log("Avn : ", Avn, " sq.mm");                                                                     //printing the information in console
      console.log("Atn : ", Atn, " sq.mm");                                                                     //printing the information in console
      console.log("Atg : ", Atg, " sq.mm");                                                                     //printing the information in console

      console.log("Block Shear, For tension fracture and shear yield : ", Tdb1/1000, " kN");  //printing the information in console
      console.log("Block Shear, For tension yield and shear fracture : ", Tdb2/1000, " kN");  //printing the information in console

      let DesignTensileStrengthOfAngle = Math.min( Tdg, Tdn, Tdb );
      output.design_tensile_strength_of_angle = DesignTensileStrengthOfAngle;
      let Lamda = (LengthOfTensionMember/AngleRGyration);            //Check for Slenderness Ratio
      
      console.log("DesignTensileStrengthOfAngle ", DesignTensileStrengthOfAngle);  //printing the information in console

      if( DesignTensileStrengthOfAngle >= FactoredLoad && Lamda<AllowableSlendernessRatio ){
        console.log("Hence the chosen section ",AngleName, " is OK");  //printing the information in console
        isDone = true;
        output.name = AngleName;
        return output;
      }
    }

    if( isDone ){
      break
    }
  }
}

function TwoAngleSectionOnSameSide() {
  let ans = undefined;
  
  const [finalAns, setFinalAns] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [input, setInput] = useState({
    factoredLoad:'in kN', 
    lengthOfTM:'in mm', 
    allowableSR:'', 
    equalORunequal:false,
    fe415:false,
    uStressSteel:'in N/sq.mm',
    yStressSteel:'in N/sq.mm',
    autoPSF:false,
    pSF_US:'ym1',
    pSF_YS:'ym0',
    uStrengthBolt:'in N/sq.mm',
    diameterBolt:'in mm',
    autoPitch:false,
    pitch:'in mm',
    editDistance:'in mm',
    autoPSFbolt:false,
    pSF_Bolt:'ymb'});

  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setInput({...input, [name]: value});
  }

  const handleChangeGiven = (name, value) => {
    setInput({...input, [name]: value});
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    output = make_design(input, output);
    console.log(ans, "in the handleSubmit");
  }

  return (
    <div >
      <style>{'body {background-color: black;}'}</style>
      <p>
          <Link to='/'>
            <img 
              src={home} 
              alt="home"
              style={{width:'35px', position:'absolute', right:'1.25%'}}></img>
          </Link>
      </p>
      <p
        className='heading_light'
        style = {{position:'absolute', top:'-55px', left:'45px'}}>Double Angle Section with</p>
      <p
        className='heading_medium'
        style = {{position:'absolute', top:'30px', left:'45px'}}>Bolted Connections </p>
      <p
        className='heading_light'
        style = {{position:'absolute', top:'42px', left:'655px'}}>on Same Side</p>

      <article>
        <form>
          <p
            className='heading_light'
            style = {{position:'absolute', top:'230px', left:'45px', fontSize:'37px'}}>General</p>
          <p
            className='heading_medium'
            style = {{position:'absolute', top:'230px', left:'145px', fontSize:'37px'}}>Inputs</p>
          //factoredLoad
          <label 
              htmlFor='factoredLoad'
              className='form_info'
              style={{position:'absolute', top:'330px', left:'45px'}}>Factored Load</label>
          <input
            type='number'
            id='factoredLoad'
            name='factoredLoad'
            placeholder={input.factoredLoad}
            value={input.factoredLoad}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'330px', left:'325px'}}></input>
          
          //lengthOfTM
          <label 
              htmlFor='lengthOfTM'
              className='form_info'
              style={{position:'absolute', top:'400px', left:'45px'}}>Length of Tension Member</label>
          <input
            type='number'
            id='lengthOfTM'
            name='lengthOfTM'
            value={input.lengthOfTM}
            placeholder={input.lengthOfTM}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'400px', left:'325px'}}></input>

          //allowableSR
          <label 
              htmlFor='allowableSR'
              className='form_info'
              style={{position:'absolute', top:'470px', left:'45px'}}>Allowable Slenderness Ratio</label>
          <input
            type='number'
            id='allowableSR'
            name='allowableSR'
            value={input.allowableSR}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'470px', left:'325px'}}></input>

          <p className='heading_light' style = {{position:'absolute', top:'370px', left:'550px', fontSize:'37px'}}>Type of</p>
          <p className='heading_medium' style = {{position:'absolute', top:'370px', left:'650px', fontSize:'37px'}}>Section</p>
          <p className='heading_light' style = {{position:'absolute', top:'370px', left:'755px', fontSize:'37px'}}>( Considering both <b>Identical Sections</b> )</p>
          <input type="checkbox" 
            defaultChecked={false} 
            style={{position:'absolute', top:'270px', left:'550px'}}
            onChange={()=>{setInput({...input, equalORunequal:(!input.equalORunequal)})}}></input>
          {(input.equalORunequal ?(<p className='heading_light' style = {{position:'absolute', top:'430px', left:'650px', fontSize:'37px'}}><b>Equal Sections</b></p>):(<p className='heading_light' style = {{position:'absolute', top:'430px', left:'650px', fontSize:'37px'}}><b>Unequal Sections</b> with Longer leg connected</p>))}


          <p
            className='heading_light'
            style = {{position:'absolute', top:'500px', left:'45px', fontSize:'37px'}}>Properties of</p>
          <p
            className='heading_medium'
            style = {{position:'absolute', top:'500px', left:'210px', fontSize:'37px'}}>Steel</p>

          <input type="checkbox" 
            defaultChecked={false} 
            style={{position:'absolute', top:'532px', left:'550px'}}
            onChange={()=>{setInput({...input, fe415:(!input.fe415)})}}></input>
          {input.fe415?( (input.uStressSteel=='410.00')?(true):(handleChangeGiven('uStressSteel', '410.00')) ):( (input.uStressSteel=='410.00')?(handleChangeGiven('uStressSteel', 'in N/mm^2')):(true)  )}
          {input.fe415?( (input.yStressSteel=='250.00')?(true):(handleChangeGiven('yStressSteel', '250.00')) ):( (input.yStressSteel=='250.00')?(handleChangeGiven('yStressSteel', 'in N/mm^2')):(true)  )}
          <p className='heading_light'
            style = {{position:'absolute', top:'560px', left:'660px', fontSize:'37px'}}>Consider </p>
          <p className='heading_medium'
            style = {{position:'absolute', top:'560px', left:'775px', fontSize:'37px'}}>Fe415 Steel</p>

          //uStressSteel
          <label 
              htmlFor='uStressSteel'
              className='form_info'
              style={{position:'absolute', top:'605px', left:'45px'}}>Ultimate Stress of Steel</label>
          <input
            type='number'
            id='uStressSteel'
            name='uStressSteel'
            value={input.uStressSteel}
            placeholder={input.uStressSteel}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'605px', left:'325px'}}></input>

          //yStressSteel
          <label 
              htmlFor='yStressSteel'
              className='form_info'
              style={{position:'absolute', top:'675px', left:'45px'}}>Yeild Stress of Steel</label>
          <input
            type='number'
            id='yStressSteel'
            name='yStressSteel'
            value={input.yStressSteel}
            placeholder={input.yStressSteel}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'675px', left:'325px'}}></input>
          

          <p
            className='heading_light'
            style = {{position:'absolute', top:'710px', left:'45px', fontSize:'37px'}}>Partial Safety</p>
          <p
            className='heading_medium'
            style = {{position:'absolute', top:'710px', left:'225px', fontSize:'37px'}}>Factors</p>

          <input type="checkbox" 
            defaultChecked={false} 
            style={{position:'absolute', top:'945px', left:'550px'}}
            onChange={()=>{setInput({...input, autoPSF:(!input.autoPSF)})}}></input>
          {input.autoPSF?( (input.pSF_US=='1.2500')?(true):(handleChangeGiven('pSF_US', '1.2500')) ):( (input.pSF_US=='1.2500')?(handleChangeGiven('pSF_US', 'ym1')):(true)  )}
          {input.autoPSF?( (input.pSF_YS=='1.1000')?(true):(handleChangeGiven('pSF_YS', '1.1000')) ):( (input.pSF_YS=='1.1000')?(handleChangeGiven('pSF_YS', 'ym0')):(true)  )}
          <p className='heading_light'
            style = {{position:'absolute', top:'767px', left:'660px', fontSize:'37px'}}>Take according to </p>
          <p className='heading_medium'
            style = {{position:'absolute', top:'767px', left:'880px', fontSize:'37px'}}>IS800 Table 5</p>

          //pSF_US
          <label 
              htmlFor='pSF_US'
              className='form_info'
              style={{position:'absolute', top:'810px', left:'45px'}}>Partial Safety Factor US</label>
          <input
            type='number'
            id='pSF_US'
            name='pSF_US'
            value={input.pSF_US}
            placeholder={input.pSF_US}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'810px', left:'325px'}}></input>

          //pSF_YS
          <label 
              htmlFor='pSF_YS'
              className='form_info'
              style={{position:'absolute', top:'880px', left:'45px'}}>Partial Safety Factor YS</label>
          <input
            type='number'
            id='pSF_YS'
            name='pSF_YS'
            value={input.pSF_YS}
            placeholder={input.pSF_YS}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'880px', left:'325px'}}></input>


          <p
            className='heading_light'
            style = {{position:'absolute', top:'915px', left:'45px', fontSize:'37px'}}>Properties of</p>
          <p
            className='heading_medium'
            style = {{position:'absolute', top:'915px', left:'210px', fontSize:'37px'}}>Bolt</p>
          //uStrengthBolt
          <label 
              htmlFor='uStrengthBolt'
              className='form_info'
              style={{position:'absolute', top:'1015px', left:'45px'}}>Ultimate Strength of Bolt</label>
          <input
            type='number'
            id='uStrengthBolt'
            name='uStrengthBolt'
            value={input.uStrengthBolt}
            placeholder={input.uStrengthBolt}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'1015px', left:'325px'}}></input>

          //diameterBolt
          <label 
              htmlFor='diameterBolt'
              className='form_info'
              style={{position:'absolute', top:'1085px', left:'45px'}}>Diameter of Bolt</label>
          <input
            type='number'
            id='diameterBolt'
            name='diameterBolt'
            value={input.diameterBolt}
            placeholder={input.diameterBolt}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'1085px', left:'325px'}}></input>

          //pitch
          <input type="checkbox" 
            defaultChecked={false} 
            style={{position:'absolute', top:'1640px', left:'550px'}}
            onChange={()=>{setInput({...input, autoPitch:(!input.autoPitch)})}}></input>
          {input.autoPitch?( (input.pitch=='50.000')?(true):(handleChangeGiven('pitch', '50.000')) ):( (input.pitch=='50.000')?(handleChangeGiven('pitch', 'in mm')):(true)  )}
          {input.autoPitch?( (input.editDistance=='30.000')?(true):(handleChangeGiven('editDistance', '30.000')) ):( (input.editDistance=='30.000')?(handleChangeGiven('editDistance', 'in mm')):(true)  )}
          <p className='heading_light'
            style = {{position:'absolute', top:'1115px', left:'660px', fontSize:'37px'}}>Take Minimum values according to</p>
          <p className='heading_medium'
            style = {{position:'absolute', top:'1115px', left:'1083px', fontSize:'37px'}}>IS800 Code</p>

          <label 
              htmlFor='pitch'
              className='form_info'
              style={{position:'absolute', top:'1155px', left:'45px'}}>Pitch</label>
          <input
            type='number'
            id='pitch'
            name='pitch'
            value={input.pitch}
            onChange={handleChange}
            placeholder={input.pitch}
            className='form_input'
            style={{position:'absolute', top:'1155px', left:'325px'}}></input>

          //editDistance
          <label 
              htmlFor='editDistance'
              className='form_info'
              style={{position:'absolute', top:'1225px', left:'45px'}}>Edit Distance</label>
          <input
            type='number'
            id='editDistance'
            name='editDistance'
            value={input.editDistance}
            placeholder={input.editDistance}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'1225px', left:'325px'}}></input>

          //pSF_Bolt
          <input type="checkbox" 
            defaultChecked={false} 
            style={{position:'absolute', top:'1920px', left:'550px'}}
            onChange={()=>{setInput({...input, autoPSFbolt:(!input.autoPSFbolt)})}}></input>
          {input.autoPSFbolt?( (input.pSF_Bolt=='1.2500')?(true):(handleChangeGiven('pSF_Bolt', '1.2500')) ):( (input.pSF_Bolt=='1.2500')?(handleChangeGiven('pSF_Bolt', 'ymb')):(true)  )}
          <p className='heading_light'
            style = {{position:'absolute', top:'1255px', left:'660px', fontSize:'37px'}}>Take according to </p>
          <p className='heading_medium'
            style = {{position:'absolute', top:'1255px', left:'880px', fontSize:'37px'}}>IS800 Table 5</p>

          <label 
              htmlFor='pSF_Bolt'
              className='form_info'
              style={{position:'absolute', top:'1295px', left:'45px'}}>PSF of Bolt</label>
          <input
            type='number'
            id='pSF_Bolt'
            name='pSF_Bolt'
            value={input.pSF_Bolt}
            placeholder={input.pSF_Bolt}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'1295px', left:'325px'}}></input>
          

        </form>

        <button 
          type='submit'
          className='btn'
          style={{position:'absolute', top:'1395px', left:'475px', width:'362px'}}
          onClick={(e)=>{
            handleSubmit(e);
            setIsDone(true);
            console.log(finalAns);
          }}>Design</button>
        <Modal isOpen={isDone} className='Modal'>
          <button onClick={()=>{setIsDone(false)}} className='modal_btn'><img src={cancel} alt="cancel" style={{width:'35px', position:'absolute', right:'1.25%'}}></img></button>
          <p className='heading_light' style={{position:'absolute', left:'45%', top:'-50px'}}>Output</p>
          <p>&nbsp;</p> 
          <p>&nbsp;</p> 
          <p className='output' style={{fontSize:'40px'}}>Minimun Area Required: <b style={{fontSize:'45px', color:'#f6b93b'}}>{parseFloat((output.min_area_required)).toFixed(2)}</b> sq.mm
          <br /> Shearing strength of one bolt: <b style={{fontSize:'45px', color:'#f6b93b'}}>{parseFloat((output.shear_StrngthBolt)/ 1000).toFixed(2)}</b> kN
          <br />Bearing strength of one bolt: <b style={{fontSize:'45px', color:'#f6b93b'}}>{parseFloat((output.bearing_StrengthBolt)/ 1000).toFixed(2)}</b> kN
          <br />Number of bolts on each section: <b style={{fontSize:'45px', color:'#f6b93b'}}>{output.NoOfBolts}</b>
          <br />Design Strength due to Yielding: <b style={{fontSize:'45px', color:'#f6b93b'}}>{parseFloat((output.strength_due_to_yeilding)/ 1000 ).toFixed(2) }</b> kN
          <br />Design Strength Due to Rupture: <b style={{fontSize:'45px', color:'#f6b93b'}}>{parseFloat((output.strength_due_to_rupture)/ 1000).toFixed(2)}</b> kN
          <br />Design Strength due to Block Shear: <b style={{fontSize:'45px', color:'#f6b93b'}}>{parseFloat((output.block_shear)/ 1000).toFixed(2)}</b> kN
          <br />Design Tensile Strength : <b style={{fontSize:'45px', color:'#f6b93b'}}>{parseFloat((output.design_tensile_strength_of_angle)/ 1000).toFixed(2)}</b> kN
          <br />Hence the chosen section <b style={{fontSize:'45px', color:'#f6b93b'}}>{output.name}</b> is OK.</p>
        </Modal>
        <hr style={{position:'absolute', top:'1450px', background:'#000000'}}></hr>
      </article>
    </div>
  );
}

export default TwoAngleSectionOnSameSide;
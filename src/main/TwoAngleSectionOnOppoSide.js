import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Modal from 'react-modal';

import {Link} from 'react-router-dom';
import home from './imgANDfonts/home.png';
import cancel from './imgANDfonts/cancel.png';

import './main.css';
import './data/unequal_angles.json';

var output = {
    min_area_required : undefined,
    strength_per_unit_length:undefined,
    length_of_weld_1:undefined,
    length_of_weld_2:undefined,
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
  let ThroatThickness = parseFloat(input.throatThickness);
  let PSF_Weld = parseFloat(input.psf_weld);

  let size = (input.equalORunequal)?(72):(65);
  /*---------------------Since Both the angle in total will hold the Factored Load------------------------*/
  FactoredLoad = FactoredLoad/2;

  /*---------------------The Design Algorithm------------------------*/
  /*---------------------Min. Area Required------------------------*/
  let minAreaRequired = (FactoredLoad*PSF_Yeilding)/(YeildStressOfSteel);
  console.log("Minimum Area Required : ", minAreaRequired, " sq.mm");

  /*---------------------Strength of Weld Per Unit Length------------------------*/
  let StrengthOfWeldperunitLength = (ThroatThickness*UltimateStressOfSteel)/(1.73*PSF_Weld);
  let LengthOfWeld = (FactoredLoad)/(StrengthOfWeldperunitLength);

  /*---------------------General Variables------------------------*/
  let count = 0;
  let isDone = false;
  for( let i=0;i<size;i++ ){
    let AreaOfAngle = undefined;
    let AngleLength = undefined;
    let AngleWidth = undefined;
    let AngleThickness = undefined;
    let CenterOfGravity_Cxx = undefined;
    let AngleName = undefined;
    let AngleRGyration = undefined;
    if( !input.equalORunequal ){
      AreaOfAngle = (unequal_angles[i].area)*(100);
      AngleLength = unequal_angles[i].Length;
      AngleWidth = unequal_angles[i].Width;
      AngleThickness = unequal_angles[i].thickness;
      CenterOfGravity_Cxx = unequal_angles[i].Cxx * 10;
      AngleName = unequal_angles[i].name;
      AngleRGyration = unequal_angles[i].rzz * 10;
    }
    else{
      AreaOfAngle = (equal_angles[i].area)*(100);
      AngleLength = equal_angles[i].Length;
      AngleWidth = equal_angles[i].Width;
      AngleThickness = equal_angles[i].thickness;
      CenterOfGravity_Cxx = equal_angles[i].Cxx * 10;
      AngleName = equal_angles[i].name;
      AngleRGyration = equal_angles[i].rzz * 10;
    }
    
    if( AreaOfAngle >= minAreaRequired ){
      count++;
      console.log('Test case ', count, " ---------------------------------_");//printing the information in console
      console.log("Area of Angle : ", AreaOfAngle, " sq.mm");                 //printing the information in console
      
      /*---------------------Length of Welds in both direction------------------------*/
      let LengthOfWeldInUpperSide = Math.ceil( (FactoredLoad*CenterOfGravity_Cxx)/(StrengthOfWeldperunitLength*AngleLength) );
      let LengthOfWeldInLowerSide = LengthOfWeld-LengthOfWeldInUpperSide;

      console.log("Length Of Weld In Upper Side : ", LengthOfWeldInUpperSide, " mm");  //printing the information in console
      console.log("Length Of Weld In Lower Side : ", LengthOfWeldInLowerSide, " mm");  //printing the information in console

      /*---------------------Design Strength due to Yielding------------------------*/
      let Tdg = (AreaOfAngle*YeildStressOfSteel)/(PSF_Yeilding);
      
      console.log("Strength due to Yeilding : ", Tdg/1000, " kN");  //printing the information in console

      /*---------------------Design Strength due to Rupture------------------------*/
      let alpha = 0.8;
      let Anc = (AngleLength - (AngleThickness/2))*(AngleThickness);
      let Ago = (AngleWidth - (AngleThickness/2))*(AngleThickness);
      let An = Anc+Ago;
      let Tdn = (alpha*An*UltimateStressOfSteel)/(PSF_UltimateStress);
      
      console.log("Anc : ", Anc, " sq.mm");                                         //printing the information in console
      console.log("Ago : ", Ago, " sq.mm");                                         //printing the information in console
      console.log("An : ", An, " sq.mm");                                           //printing the information in console
      console.log("Design Strength due to Rupture : ", Tdn/1000, " kN");            //printing the information in console

      /*---------------------Design Strength due to Block Shear------------------------*/
      let Avg = (Math.max(LengthOfWeldInUpperSide, LengthOfWeldInLowerSide))*(AngleThickness)*2;
      let Avn = (Math.max(LengthOfWeldInUpperSide, LengthOfWeldInLowerSide))*(AngleThickness)*2;
      let Atn = (AngleLength)*(AngleThickness);
      let Atg = (AngleLength)*(AngleThickness);

      let Tdb1 = ( (0.9*Avn*UltimateStressOfSteel)/(1.73*PSF_UltimateStress) )+( (YeildStressOfSteel*Atg)/(PSF_Yeilding) );
      let Tdb2 = ( (Avg*YeildStressOfSteel)/(1.73*PSF_Yeilding) )+( (0.9*UltimateStressOfSteel*Atn)/(PSF_UltimateStress) );

      let Tdb = Math.min(Tdb1, Tdb2);
      
      console.log("Avg : ", Avg, " sq.mm");                                                                     //printing the information in console
      console.log("Avn : ", Avn, " sq.mm");                                                                     //printing the information in console
      console.log("Atn : ", Atn, " sq.mm");                                                                     //printing the information in console
      console.log("Atg : ", Atg, " sq.mm");                                                                     //printing the information in console
      console.log("Strength due to Block Shear, For tension yield and shear fracture : ", Tdb1/1000, " kN");    //printing the information in console
      console.log("Strength due to Block Shear, For tension fracture and shear yield : ", Tdb2/1000, " kN");    //printing the information in console
      console.log("Design Strength due to Block Shear : ", Tdb/1000, " kN");                                    //printing the information in console

      let DesignTensileStrengthOfAngle = Math.min( Tdg, Tdn, Tdb );
      let Lamda = (LengthOfTensionMember/AngleRGyration);
      
      console.log("DesignTensileStrengthOfAngle ", DesignTensileStrengthOfAngle);

      if( DesignTensileStrengthOfAngle>=FactoredLoad && Lamda<AllowableSlendernessRatio ){
        console.log("Hence the chosen section ",AngleName, " is OK");  //printing the information in console
        output.min_area_required = minAreaRequired;
        output.strength_per_unit_length = StrengthOfWeldperunitLength;
        output.length_of_weld_1 = LengthOfWeldInUpperSide;
        output.length_of_weld_2 = LengthOfWeldInLowerSide;
        output.strength_due_to_yeilding = Tdg;
        output.strength_due_to_rupture = Tdn;
        output.block_shear = Tdb;
        output.design_tensile_strength_of_angle = DesignTensileStrengthOfAngle;

        output.name = AngleName;
        isDone = true;
      }
    }

    if( isDone ){
      break
    }
  }
}

function TwoAngleSectionOnOppoSide() {
  const [isDone, setIsDone] = useState(false);

  const [input, setInput] = useState({
    factoredLoad:'in kN', 
    lengthOfTM:'in mm', 
    allowableSR:'', 
    equalORunequal:false,
    fe415:false,
    uStressSteel:'in N/mm^2',
    yStressSteel:'in N/mm^2',
    autoPSF:false,
    pSF_US:'ym1',
    pSF_YS:'ym0',
    throatThickness:'in mm',
    autoPSFweld:false,
    psf_weld:'1.2500'});

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
    make_design(input, output);
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
        style = {{position:'absolute', top:'30px', left:'45px'}}>Welded Connections</p>
      <p
        className='heading_light'
        style = {{position:'absolute', top:'42px', left:'680px'}}>on either side</p>


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
              style={{position:'absolute', top:'330px', left:'45px'}}>Total Factored Load</label>
          <input
            type='number'
            id='factoredLoad'
            name='factoredLoad'
            value={input.factoredLoad}
            placeholder={input.factoredLoad}
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
            placeholder={input.allowableSR}
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
            style = {{position:'absolute', top:'490px', left:'45px', fontSize:'37px'}}>Properties of</p>
          <p
            className='heading_medium'
            style = {{position:'absolute', top:'490px', left:'210px', fontSize:'37px'}}>Steel</p>

          <input type="checkbox" 
            defaultChecked={false} 
            style={{position:'absolute', top:'510px', left:'550px'}}
            onChange={()=>{setInput({...input, fe415:(!input.fe415)})}}></input>
          {input.fe415?( (input.uStressSteel=='410.00')?(true):(handleChangeGiven('uStressSteel', '410.00')) ):( (input.uStressSteel=='410.00')?(handleChangeGiven('uStressSteel', 'in N/mm^2')):(true)  )}
          {input.fe415?( (input.yStressSteel=='250.00')?(true):(handleChangeGiven('yStressSteel', '250.00')) ):( (input.yStressSteel=='250.00')?(handleChangeGiven('yStressSteel', 'in N/mm^2')):(true)  )}
          <p className='heading_light'
            style = {{position:'absolute', top:'550px', left:'660px', fontSize:'37px'}}>Consider </p>
          <p className='heading_medium'
            style = {{position:'absolute', top:'550px', left:'775px', fontSize:'37px'}}>Fe415 Steel</p>
          
          //uStressSteel
          <label 
              htmlFor='uStressSteel'
              className='form_info'
              style={{position:'absolute', top:'590px', left:'45px'}}>Ultimate Stress of Steel</label>
          <input
            type='number'
            id='uStressSteel'
            name='uStressSteel'
            value={input.uStressSteel}
            placeholder={input.uStressSteel}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'590px', left:'325px'}}></input>

          //yStressSteel
          <label 
              htmlFor='yStressSteel'
              className='form_info'
              style={{position:'absolute', top:'660px', left:'45px'}}>Yeild Stress of Steel</label>
          <input
            type='number'
            id='yStressSteel'
            name='yStressSteel'
            value={input.yStressSteel}
            placeholder={input.yStressSteel}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'660px', left:'325px'}}></input>
          

          <p
            className='heading_light'
            style = {{position:'absolute', top:'690px', left:'45px', fontSize:'37px'}}>Partial Safety</p>
          <p
            className='heading_medium'
            style = {{position:'absolute', top:'690px', left:'225px', fontSize:'37px'}}>Factors</p>

          <input type="checkbox" 
            defaultChecked={false} 
            style={{position:'absolute', top:'905px', left:'550px'}}
            onChange={()=>{setInput({...input, autoPSF:(!input.autoPSF)})}}></input>
          {input.autoPSF?( (input.pSF_US=='1.2500')?(true):(handleChangeGiven('pSF_US', '1.2500')) ):( (input.pSF_US=='1.2500')?(handleChangeGiven('pSF_US', 'ym1')):(true)  )}
          {input.autoPSF?( (input.pSF_YS=='1.1000')?(true):(handleChangeGiven('pSF_YS', '1.1000')) ):( (input.pSF_YS=='1.1000')?(handleChangeGiven('pSF_YS', 'ym0')):(true)  )}
          <p className='heading_light'
            style = {{position:'absolute', top:'747px', left:'655px', fontSize:'37px'}}>Take according to </p>
          <p className='heading_medium'
            style = {{position:'absolute', top:'747px', left:'875px', fontSize:'37px'}}>IS800 Table 5</p>

          //pSF_US
          <label 
              htmlFor='pSF_US'
              className='form_info'
              style={{position:'absolute', top:'790px', left:'45px'}}>Partial Safety Factor US</label>
          <input
            type='number'
            id='pSF_US'
            name='pSF_US'
            value={input.pSF_US}
            onChange={handleChange}
            placeholder={input.pSF_US}
            className='form_input'
            style={{position:'absolute', top:'790px', left:'325px'}}></input>

          //pSF_YS
          <label 
              htmlFor='pSF_YS'
              className='form_info'
              style={{position:'absolute', top:'860px', left:'45px'}}>Partial Safety Factor YS</label>
          <input
            type='number'
            id='pSF_YS'
            name='pSF_YS'
            value={input.pSF_YS}
            placeholder={input.pSF_YS}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'860px', left:'325px'}}></input>


          <p
            className='heading_light'
            style = {{position:'absolute', top:'900px', left:'45px', fontSize:'37px'}}>Properties of</p>
          <p
            className='heading_medium'
            style = {{position:'absolute', top:'900px', left:'210px', fontSize:'37px'}}>Weld</p>
          //throatThickness
          <label 
              htmlFor='throatThickness'
              className='form_info'
              style={{position:'absolute', top:'1000px', left:'45px'}}>Throat Thickness</label>
          <input
            type='number'
            id='throatThickness'
            name='throatThickness'
            value={input.throatThickness}
            placeholder={input.throatThickness}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'1000px', left:'325px'}}></input>

          <input type="checkbox" 
            defaultChecked={false} 
            style={{position:'absolute', top:'1470px', left:'550px'}}
            onChange={()=>{setInput({...input, autoPSFweld:(!input.autoPSFweld)})}}></input>
          {input.autoPSFweld?( (input.psf_weld=='1.5000')?(true):(handleChangeGiven('psf_weld', '1.5000')) ):( (input.psf_weld=='1.5000')?(handleChangeGiven('psf_weld', '1.2500')):(true)  )}
          {input.autoPSFweld?( <p className='heading_light' style = {{position:'absolute', top:'1030px', left:'655px', fontSize:'37px'}}>Feild Fabrications</p> ):( <p className='heading_light' style = {{position:'absolute', top:'1030px', left:'655px', fontSize:'37px'}}>Shop Fabrications</p> )}

          //psf_weld
          <label 
              htmlFor='psf_weld'
              className='form_info'
              style={{position:'absolute', top:'1070px', left:'45px'}}>Partial Safety Factor</label>
          <input
            type='number'
            id='psf_weld'
            name='psf_weld'
            value={input.psf_weld}
            placeholder={input.psf_weld}
            onChange={handleChange}
            className='form_input'
            style={{position:'absolute', top:'1070px', left:'325px'}}></input>

        </form>

        <button 
            type='submit'
            className='btn'
            style={{position:'absolute', top:'1170px', left:'475px', width:'362px'}}
            onClick={(e)=>{
            handleSubmit(e);
            setIsDone(true);
            }}>Design</button>
        
        <Modal isOpen={isDone} className='Modal'>
          <button onClick={()=>{setIsDone(false)}} className='modal_btn'><img src={cancel} alt="cancel" style={{width:'35px', position:'absolute', right:'1.25%'}}></img></button>
          <p className='heading_light' style={{position:'absolute', left:'45%', top:'-50px'}}>Output</p>
          <p>&nbsp;</p> 
          <p>&nbsp;</p> 
          <p className='output' style={{fontSize:'40px'}}>Minimun Area Required: <b style={{fontSize:'45px', color:'#f6b93b'}}>{parseFloat((output.min_area_required)).toFixed(2)}</b> sq.mm
          <br />Minimum length of weld at the upper side of the angle: <b style={{fontSize:'45px', color:'#f6b93b'}}>{parseFloat((output.length_of_weld_1)).toFixed(2)}</b> mm
          <br />Minimum length of weld at the lower side of the angle: <b style={{fontSize:'45px', color:'#f6b93b'}}>{parseFloat((output.length_of_weld_2)).toFixed(2)}</b> mm
          <br />Design Strength due to Yielding: <b style={{fontSize:'45px', color:'#f6b93b'}}>{parseFloat((output.strength_due_to_yeilding)/1000).toFixed(2)}</b> kN
          <br />Design Strength Due to Rupture: <b style={{fontSize:'45px', color:'#f6b93b'}}>{parseFloat((output.strength_due_to_rupture)/1000).toFixed(2)}</b> kN
          <br />Design Strength due to Block Shear: <b style={{fontSize:'45px', color:'#f6b93b'}}>{parseFloat((output.block_shear) /1000).toFixed(2) }</b> kN
          <br />Design Tensile Strength : <b style={{fontSize:'45px', color:'#f6b93b'}}>{parseFloat((output.design_tensile_strength_of_angle)/1000).toFixed(2) }</b> kN
          <br />Hence the chosen section <b style={{fontSize:'45px', color:'#f6b93b'}}>{output.name}</b> is OK.</p>
        </Modal>
        <hr style={{position:'absolute', top:'1225px', background:'#000000'}}></hr>
      </article>
    </div>
  );
}

export default TwoAngleSectionOnOppoSide;
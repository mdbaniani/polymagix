import { useState } from "react";
import { MapContainer, TileLayer, Polygon, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import MapEvents from "./Components/MapEvents";

//fix marker image missing
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25,41],//fix inaccurate marker icon position
    iconAnchor: [12,41]//fix inaccurate marker icon position
});

L.Marker.prototype.options.icon = DefaultIcon;

let intervalId  
function App() {
  const [center,setCenter] = useState([35.65433882392078, 51.39383912086487])
  const [zoom,setZoom] = useState(13)
  const [polygons,setPolygons] = useState([])//array of polygons
  const [tmpPolygon, setTmpPolygon] = useState([]);//aray of dots
  const [imageUrl, setImageUrl] = useState(null);
  const [isImageLocked,setIsImageLocked] = useState(false)
  const [imageRotation,setImageRotation] = useState(0)
  const [imageScale,setImageScale] = useState(1)
  const [imageTranslateX,setImageTranslateX] = useState(0)
  const [imageTranslateY,setImageTranslateY] = useState(0)
  const [predefinedPolygons,setPredefinedPolygons] = useState('[]')

  
  const prepareTmpPolygon = (position) => {
    console.log(position)    
    const newPolygon = [...tmpPolygon, position];
    setTmpPolygon(newPolygon);
  };
  const addPolygon = () =>{
    let tmp = [...polygons, tmpPolygon];
    setPolygons(tmp)
    setTmpPolygon([])//empty temp polygon
    console.log(polygons)
  }
  const undoTempPolygon = () => {
    let tmp = [...tmpPolygon]
    tmp.pop()
    setTmpPolygon(tmp)
  }
  const handleImageChange = (e) => {
    // const selectedImage = e.target.files[0];
    // setImage(URL.createObjectURL(selectedImage));
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      setImageUrl(event.target.result);
    };

    reader.readAsDataURL(file);
  }

  const handlePolygonPreLoad = (e) => {
    e.preventDefault();       
    setPolygons((prev) => [...JSON.parse(predefinedPolygons)])    
  }

  const moveImage = (x,y) => {
    setImageTranslateX((prevPos) => prevPos +=x);    
    setImageTranslateY((prevPos) => prevPos +=y);   
  }

  return (
    <div className="App">
        <h1>Leaflet Map Tool</h1>
        <p>Use this tool to draw polygons on a map based on an underlying image.</p>
        <form>
          <fieldset>
            <legend>Underlying Image</legend>
            <p>You can optionally select an image as an underlying layer of the map.</p>
            <label htmlFor="image-url"></label>
            <input type="file" onChange={handleImageChange} id="image-url" name="image-url" />         
          </fieldset>                   
        </form>
        {/* image controls */}
        <form>
          <fieldset>
            <legend>Image Controls</legend>
            <button 
            onMouseDown={(e)=>{
              e.preventDefault();   
              intervalId = setInterval(()=>{setImageRotation((prevVal) => prevVal += 1)},100)
            }} 
            onMouseUp={(e)=>{
              e.preventDefault();   
              clearInterval(intervalId)
            }}
            onClick={(e)=>{
              e.preventDefault();   
              setImageRotation((prevVal) => prevVal += 1)
            }}>Rotate Clockwise</button>

        <button 
            onMouseDown={(e)=>{
              e.preventDefault();   
              intervalId = setInterval(()=>{setImageRotation((prevVal) => prevVal -= 1)},100)
            }} 
            onMouseUp={(e)=>{
              e.preventDefault();   
              clearInterval(intervalId)
            }}
            onClick={(e)=>{
              e.preventDefault();   
              setImageRotation((prevVal) => prevVal -= 1)
              }}>Rotate Counter Clockwise</button>
        
          <button 
            onMouseDown={(e)=>{
              e.preventDefault();   
              intervalId = setInterval(()=>{setImageScale((prevVal) => prevVal + 0.02)},100)
            }} 
            onMouseUp={(e)=>{
              e.preventDefault();   
              clearInterval(intervalId)
            }}
            onClick={(e)=>{
              e.preventDefault();   
              setImageScale((prevVal) => prevVal + 0.01)
              }}>Zoom In</button>
          <button 
            onMouseDown={(e)=>{
              e.preventDefault();   
              intervalId = setInterval(()=>{setImageScale((prevVal) => prevVal - 0.02)},100)
            }} 
            onMouseUp={(e)=>{
              e.preventDefault();   
              clearInterval(intervalId)
            }}
            onClick={(e)=>{
              e.preventDefault();   
              setImageScale((prevVal) => prevVal - 0.01)
              }}>Zoom Out</button>

           <button 
            onMouseDown={(e)=>{
              e.preventDefault();   
              intervalId = setInterval(()=>{moveImage(0,-10)},100)
            }} 
            onMouseUp={(e)=>{
              e.preventDefault();   
              clearInterval(intervalId)
            }}
            onClick={(e)=>{
              e.preventDefault();   
              moveImage(0,-1)
              }}>Move Up</button>
           <button 
            onMouseDown={(e)=>{
              e.preventDefault();   
              intervalId = setInterval(()=>{moveImage(0,10)},100)
            }} 
            onMouseUp={(e)=>{
              e.preventDefault();   
              clearInterval(intervalId)}}
            onClick={(e)=>{
              e.preventDefault();   
              moveImage(0,1)}}>Move Down</button>
            <button 
            onMouseDown={(e)=>{
              e.preventDefault();   
              intervalId = setInterval(()=>{moveImage(10,0)},100)}} 
            onMouseUp={(e)=>{
              e.preventDefault();   
              clearInterval(intervalId)}}
            onClick={(e)=>{
              e.preventDefault();   
              moveImage(1,0)}}>Move Right</button>
            <button 
            onMouseDown={(e)=>{
              e.preventDefault();   
              intervalId = setInterval(()=>{moveImage(-10,0)},100)}} 
            onMouseUp={(e)=>{
              e.preventDefault();   
              clearInterval(intervalId)}}
            onClick={(e)=>{
              e.preventDefault();   
              moveImage(-1,0)}}>Move Left</button>
            <label>
              <input
                type="checkbox"
                checked={isImageLocked}
                onChange={()=>{setIsImageLocked((prev) => !prev)}}
              />
              Lock Image
            </label>
          </fieldset>                   
        </form>
        
        <form>
          <fieldset>
            <legend>Predefined Polygons</legend><br />
            <p>You can can also enter predefined polygons as an array of polygons.</p>
            <label htmlFor="pre-defined-polygons"></label><br/>
            <textarea id="pre-defined-polygons" name="pre-defined-polygons" rows="4" cols="50" value={predefinedPolygons} onChange={(e)=>{setPredefinedPolygons(e.target.value)}}></textarea><br />
            <button onClick={handlePolygonPreLoad}>Submit</button>
          </fieldset>
        </form>

        {/* map outer container */}
        <div 
          style={{ 
            position:'relative',
            // margin:'1rem',
            height: 500, 
            overflow:'hidden',

          }}>
          {imageUrl && <div style={{
            position:'absolute',
            height:500,
            width:'100%',
            transform: `rotate(${imageRotation}deg) scale(${imageScale}) translateX(${imageTranslateX}px) translateY(${imageTranslateY}px)`,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
            }}>
              {/* <img src={image} 
            style={{
            }} 
              alt="Selected" /> */}
              </div>}
          <MapContainer 
            center={center} 
            zoom={zoom}   
            zoomSnap={1} //default is 1     
            style={{
              height:'100%',
              opacity:0.5
            }}
            >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {/* temporary polygon */}
            {tmpPolygon.length > 0 && <Polygon positions={tmpPolygon} />}
            {/* main polygons and markers */}
            {polygons.map((polygon,index) => {
              return (
                <div key={index}>
                  <Polygon positions={polygon} />
                  {
                    polygon.map((position,index)=>{
                      return(
                        <Marker key={index} 
                          position={position} 
                          eventHandlers={{
                            click: (e) => {
                              console.log('marker clicked')
                              prepareTmpPolygon([e.latlng.lat,e.latlng.lng])
                            },
                          }}                        
                          ></Marker>
                      )
                    })
                  }
                </div>                
              )
            })}
            <MapEvents 
              initialZoom={zoom}   
              imageScale={imageScale}
              onClick={(e) => {prepareTmpPolygon([e.latlng.lat,e.latlng.lng])}} 
              onZoomIn={()=>{
                if(isImageLocked)
                setImageScale((prev) => prev *= 2)
              }}              
              onZoomOut={()=>{
                if(isImageLocked)
                setImageScale((prev) => prev /= 2)
              }}      
              onMapMove={(x,y)=>{
                if(isImageLocked)
                moveImage(x,y)
              }}              
              />
              <button style={{zIndex:500,position:'absolute',bottom:0}}>test</button>
          </MapContainer>
        </div>
        
        <button onClick={addPolygon}>add polygon</button>
        <button onClick={undoTempPolygon}>undo</button>
        <button onClick={null}>copy polygon object</button>

        <h2>Polygons</h2>
        <ol>
          {polygons.length > 0 ?
            polygons.map((polygon,index)=>{
              return(
                <li key={index}>{JSON.stringify(polygon)}</li>
              )
            })
          :<p>No polygons found yet.</p>}
        </ol>
    </div>
  );
}

export default App;

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polygon, Marker, useMapEvent } from 'react-leaflet';
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
const initialMapZoom = 13
const initialMapCenter = [35.65433882392078, 51.39383912086487]
let intervalId  

let defaultSettings = localStorage.getItem('Settings')

if(defaultSettings){defaultSettings = JSON.parse(defaultSettings) }
function App() {
  const [groups,setGroups] = useState([])//array of groups of polygons (array of arrays)
  const [tmpPolygon, setTmpPolygon] = useState([]);//aray of dots
  const [imageUrl, setImageUrl] = useState(defaultSettings && defaultSettings.imageUrl ? defaultSettings.imageUrl : null);
  const [isImageLocked,setIsImageLocked] = useState(defaultSettings ? defaultSettings.isImageLocked : false)
  const [imageRotation,setImageRotation] = useState(0)
  const [imageScale,setImageScale] = useState(1)
  const [imageTranslateX,setImageTranslateX] = useState(0)
  const [imageTranslateY,setImageTranslateY] = useState(0)
  const [predefinedPolygons,setPredefinedPolygons] = useState('[]')
  const [selectedGroup,setSelectedGroup] = useState(0)


  const latestMapPane = useRef({x:0,y:0});
  const mapCenter = useRef(defaultSettings? defaultSettings.mapCenter : initialMapCenter)
  const latestMapZoom = useRef(defaultSettings? defaultSettings.mapZoom : initialMapZoom);

  useEffect(()=>{
    if(defaultSettings){
      console.log('default settings found.',defaultSettings)      
      setImageRotation(defaultSettings.imageRotation)
      setImageScale(defaultSettings.imageScale)
      setImageTranslateX(defaultSettings.imageTranslateX)
      setImageTranslateY(defaultSettings.imageTranslateY)   
      if(defaultSettings.imageUrl){
        setImageUrl(defaultSettings.imageUrl)
      }
      
      //setting map center and zoom doesnt have any effect here
    }

    const defaultPolygons = localStorage.getItem('Polygons')
    if(defaultPolygons){
      setGroups(JSON.parse(defaultPolygons))
    }

  },[])
  
  const prepareTmpPolygon = (position) => {
    console.log(position)    
    const newPolygon = [...tmpPolygon, position];
    setTmpPolygon(newPolygon);
  };
  const addPolygon = () =>{
    if(tmpPolygon.length < 3){
      window.alert('at least 3 points should be selected on the map')
      return
    }
    let tmp = [...groups];
    tmp[selectedGroup].push(tmpPolygon)
    // console.log(tmp)
    setGroups(tmp)
    setTmpPolygon([])//empty temp polygon
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
    setGroups((prev) => [...JSON.parse(predefinedPolygons)])    
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
        {/* predefined polygons */}
        <form>
          <fieldset>
            <legend>Predefined Polygons</legend><br />
            <p>You can can also enter predefined polygons as an array of arrays of polygons.</p>
            <label htmlFor="pre-defined-polygons"></label><br/>
            <textarea id="pre-defined-polygons" name="pre-defined-polygons" rows="4" cols="50" value={predefinedPolygons} onChange={(e)=>{setPredefinedPolygons(e.target.value)}}></textarea><br />
            <button onClick={handlePolygonPreLoad}>Submit</button>
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
              Lock Image To Map
            </label>
            
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
            center={mapCenter.current} 
            zoom={latestMapZoom.current}   
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
            {
              groups.map((group,index) =>{     
                return(
                  <div key={index}>
                  {
                    group.map((polygon,index) =>{               
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
                    })
                  }                  
                </div>                
                )
                
              })
              
            }
            <MapEvents 
              imageScale={imageScale}
              onClick={(e) => {
                console.log('clicked on map.')
                prepareTmpPolygon([e.latlng.lat,e.latlng.lng])
              }} 

              onZoomEnd={(e)=>{
                const currentZoom = e.target.getZoom();
                const previousZoom = latestMapZoom.current;
          
                if (currentZoom > previousZoom) {
                  console.log('Map zoomed in');
                  if(isImageLocked)
                  setImageScale((prev) => prev *= 2)
                } else if (currentZoom < previousZoom) {
                  console.log('Map zoomed out');
                  if(isImageLocked)
                  setImageScale((prev) => prev /= 2)
                }                
                console.log('zoom level changed to',e.target.getZoom())
                latestMapZoom.current = currentZoom;
              }}

              onDragEnd={(e)=>{
                const currentPane = e.target._getMapPanePos();
                if (latestMapPane) {
                    const dx = currentPane.x - latestMapPane.current.x;
                    const dy = currentPane.y - latestMapPane.current.y;
                    console.log(`Map moved by: ${dx} pixels horizontally, ${dy} pixels vertically`);           
                    if(isImageLocked)
                    moveImage(dx/imageScale,dy/imageScale)                        
                }
                latestMapPane.current = currentPane

                let mcenter = e.target.getCenter()
                mapCenter.current = [mcenter.lat,mcenter.lng]
              }}
              />
          </MapContainer>
        </div>
        <form>
          <fieldset>
            <legend>Settings</legend>
            <button
              onClick={(e)=>{
                e.preventDefault()
                const tmp = {
                  imageRotation: imageRotation,
                  imageScale:imageScale,
                  imageTranslateX:imageTranslateX,
                  imageTranslateY:imageTranslateY,
                  mapZoom:latestMapZoom.current,
                  mapCenter:mapCenter.current,
                  imageUrl:imageUrl,
                  isImageLocked:isImageLocked
                }
                localStorage.setItem('Settings',JSON.stringify(tmp))
                window.alert('Settings Saved.')
              }}
              >
                Save Settings
              </button>
              <button
                onClick={(e)=>{
                e.preventDefault()      
                if (window.confirm("Are U sure?")){
                  localStorage.removeItem('Settings')
                  window.alert('Saved Settings Removed.')
                }             
              }}
              >
                reset
              </button>
            </fieldset>
        </form>
        <form>
          <fieldset>
            <legend>Polygons</legend>              
              <div>
                <span>{`${tmpPolygon.length} points selected.`}</span>
                {tmpPolygon.length > 0 ?
                  <button onClick={(e) => {
                    e.preventDefault()
                    undoTempPolygon()
                    }}>undo</button>
                :null}                
              </div>
              <div>
                {groups.length > 0 ?
                <div>
                  <button onClick={(e)=>{
                    e.preventDefault()
                    addPolygon()
                    }}>add polygon</button>
                    <span> to group </span>
                    <select 
                      onChange={(e)=>{setSelectedGroup(parseInt(e.target.value))}} >
                      {
                        groups.map((group,index)=>{
                          return(
                            <option key={index} value={index}>{index + 1}</option>
                          )
                        })
                     
                      }
                    </select>
                    <p>{`group ${selectedGroup + 1} has been selected`}</p>
                 </div>
                
                  :
                  <p>please add a group before assigning a polygon to a group</p>
                }
              </div>     
              <div>
                <button onClick={(e)=>{
                  e.preventDefault();
                  let tmp = [...groups]
                  tmp.push([])
                  setGroups(tmp)
                }}>
                  add group
                </button>
              </div>               

              {
                groups.length > 0 ? 
                <ol>
                {groups.map((group, gindex) => {
                  return (
                    <div key={gindex}>
                      <span>{`group ${gindex + 1} :`}</span>
                      <button
                        onClick={() => {
                          if (window.confirm("Are U sure?")){
                            let tmp = [...groups]
                            tmp.splice(gindex, 1)
                            setGroups(tmp);
                          }                    
                        }}
                      >
                        delete
                      </button>
                      <ol>
                      {group.map((polygon, pindex) => {
                        return (
                          <div key={pindex}>
                            <li key={pindex}>
                              {JSON.stringify(polygon).substring(0, 30) + "..."}
                              <button
                                onClick={() => {
                                  if (window.confirm("Are U sure?")) {
                                    let tmp = [...groups]
                                    tmp[gindex].splice(pindex, 1)
                                    setGroups(tmp);
                                  }                             
                                }}
                              >
                                delete
                              </button>
                            </li>
                          </div>                    
                        );                  
                      })}
                      </ol>   

                    </div>
                  );
                })}
        
                </ol>
                :
                <p>no polygons found.</p>
              }    
              {/* save polygons */}
              {groups.length > 0 ?
              <div>
                <button
                onClick={(e)=>{
                  e.preventDefault()                 
                  localStorage.setItem('Polygons',JSON.stringify(groups))
                  window.alert('Polygons Saved.')
                }}
                >
                  Save Polygons
                </button>
                <button
                  onClick={(e)=>{
                  e.preventDefault()      
                  if (window.confirm("Are U sure?")){
                    localStorage.removeItem('Polygons')
                    setGroups([])
                    window.alert('Saved Polygons Removed.')
                  }             
                }}
                >
                  reset
                </button>
                <button
                  onClick={(e)=>{
                  e.preventDefault()      
                  navigator.clipboard.writeText(JSON.stringify(groups))
                  .then(() => {
                    window.alert('Polygons copied to clipboard.')
                  })
                  .catch((error) => {
                    window.alert('There was an error while copying polygons to clipboard.')
                    console.error("Failed to copy: ", error);
                  });
                }}
                >
                  copy
                </button>
              </div>
              :null}
              
          </fieldset>                   
        </form>        
    </div>
  );
}


export default App;
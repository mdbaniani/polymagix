import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polygon, Marker, useMapEvent, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { latLng } from 'leaflet';

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
const defaultSettings = localStorage.getItem('Settings') ? JSON.parse(localStorage.getItem('Settings')) : undefined

function App() {
  const [districts,setDistricts] = useState([])//array of arrays of zone latlng ids (array of array of arrays)
  const [tmpZoneLatlngIds, setTmpZoneLatlngIds] = useState([]);
  const [imageUrl, setImageUrl] = useState(defaultSettings && defaultSettings.imageUrl ? defaultSettings.imageUrl : null);
  const [isImageLocked,setIsImageLocked] = useState(defaultSettings ? defaultSettings.isImageLocked : false)
  const [isImageHidden,setIsImageHidden] = useState(false)
  const [imageRotation,setImageRotation] = useState(0)
  const [imageScale,setImageScale] = useState(1)
  const [imageTranslateX,setImageTranslateX] = useState(0)
  const [imageTranslateY,setImageTranslateY] = useState(0)
  const [predefinedGeoData,setPredefinedGeoData] = useState()
  const [selectedDistrict,setSelectedDistrict] = useState(0)
  const [latlngs,setLatlngs] = useState([{id:0,latlng:[0,0]}])

  const latestMapPane = useRef({x:0,y:0});
  const mapCenter = useRef(defaultSettings? defaultSettings.mapCenter : initialMapCenter)
  const latestMapZoom = useRef(defaultSettings? defaultSettings.mapZoom : initialMapZoom);
  const intervalId = useRef()
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

    const defaultGeoData = localStorage.getItem('GeoData')
    if(defaultGeoData){
      console.log('default geodata found',defaultGeoData)
      setLatlngs(JSON.parse(defaultGeoData).latlngs)
      setDistricts(JSON.parse(defaultGeoData).districts)
    }

  },[])

  const findHighestLatlngId = () =>{
    const objectWithHighestId = latlngs.reduce((prev, current) =>
    prev.id > current.id ? prev : current
    );

    return objectWithHighestId.id
  }

  const addMemberToLatlngs = (latlng) => {
    //make object
    const newId = findHighestLatlngId() + 1
    const newObj = {
      id: newId,
      latlng : latlng
    }
    
    setLatlngs([...latlngs, newObj]);
    return newObj
  }

  const getLatlngsFromIds = (ids) => {
    if (Array.isArray(ids)) {
      return ids.map(id => {
        const foundObject = latlngs.find(obj => obj.id === id);
        return foundObject ? foundObject.latlng : null;
      });
    } else {
      const foundObject = latlngs.find(obj => obj.id === ids);
      return foundObject ? foundObject.latlng : null;
    }
  };
  
  
  const prepareTmpZoneLatlngIds = (e) => {
    let clickedLatlng = [e.latlng.lat,e.latlng.lng]
    // console.log('selected latlng:',clickedLatlng) 
    // console.log('current latlngs:',latlngs) 
    let myLatlngId    
    //check if latlng is already in latlngs
    const foundValue = latlngs.find(element => JSON.stringify(element.latlng) === JSON.stringify(clickedLatlng));
    if(foundValue){
      myLatlngId = foundValue.id
    }
    else{
      //add new latlng to our collection of latlngs    
      const newLatlng = addMemberToLatlngs(clickedLatlng)
      myLatlngId = newLatlng.id
    }
    
    //add my latlng's id to new zone array variable
    const newZone = [...tmpZoneLatlngIds, myLatlngId];
    console.log('new zone ids',newZone)
    // console.log('new zone latlngs',getLatlngsFromIds(newZone))

    setTmpZoneLatlngIds(newZone);
  };
  const addZoneLatlngIdsToDistrict = () =>{
    if(tmpZoneLatlngIds.length < 3){
      window.alert('at least 3 points should be selected on the map')
      return
    }
    let tmp = [...districts];
    tmp[selectedDistrict].push(tmpZoneLatlngIds)
    // console.log(tmp)
    setDistricts(tmp)
    setTmpZoneLatlngIds([])//empty temp zone
  }
  const undoTempZoneLatlngIds = () => {
    let tmp = [...tmpZoneLatlngIds]
    tmp.pop()
    setTmpZoneLatlngIds(tmp)
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

  const handleGeoDataPreLoad = (e) => {
    e.preventDefault();       
    setLatlngs((prev) => [...JSON.parse(predefinedGeoData).latlngs])
    setDistricts((prev) => [...JSON.parse(predefinedGeoData).districts])        
  }

  const moveImage = (x,y) => {
    setImageTranslateX((prevPos) => prevPos +=x);    
    setImageTranslateY((prevPos) => prevPos +=y);   
  }


  return (
    <div className="App">
        <h1>Polimagix</h1>
        <p>Use this tool to draw polygons on a map based on an underlying image.</p>
        <p>This tool can also be used to divide cities into districts and zones.</p>
        <form>
          <fieldset>
            <legend>Underlying Image</legend>
            <p>You can optionally select an image as an underlying layer of the map.</p>
            {
              !imageUrl ? 
              <>
                <label htmlFor="image-url"></label>
                <input type="file" onChange={handleImageChange} id="image-url" name="image-url" />         
              </>
              :
              <button onClick={(e)=>{
                e.preventDefault()
                setImageUrl(null)
              }}>Remove Image</button>
            }
            
          </fieldset>                   
        </form>
        {/* predefined polygons */}
        <form>
          <fieldset>
            <legend>Import Geo Data</legend><br />
            <p>You can import districts and zones as a formatted string if you have previously exported all geo data activity (see below).</p>
            <label htmlFor="pre-defined-geodata"></label><br/>
            <textarea id="pre-defined-geodata" name="pre-defined-geodata" rows="4" cols="50" value={predefinedGeoData} onChange={(e)=>{setPredefinedGeoData(e.target.value)}}></textarea><br />
            <button onClick={handleGeoDataPreLoad}>Submit</button>
          </fieldset>
        </form>
        {/* image controls */}
        {
          imageUrl ? 
          <form>
            <fieldset>
              <legend>Image Controls</legend>
              <button 
              onMouseDown={(e)=>{
                e.preventDefault();   
                intervalId.current = setInterval(()=>{setImageRotation((prevVal) => prevVal += 1)},100)
              }} 
              onMouseUp={(e)=>{
                e.preventDefault();   
                clearInterval(intervalId.current)
              }}
              onClick={(e)=>{
                e.preventDefault();   
                setImageRotation((prevVal) => prevVal += 1)
              }}>Rotate Clockwise</button>

            <button
              onMouseDown={(e)=>{
                e.preventDefault();   
                intervalId.current = setInterval(()=>{setImageRotation((prevVal) => prevVal -= 1)},100)
              }} 
              onMouseUp={(e)=>{
                e.preventDefault();   
                clearInterval(intervalId.current)
              }}
              onClick={(e)=>{
                e.preventDefault();   
                setImageRotation((prevVal) => prevVal -= 1)
                }}>Rotate Counter Clockwise</button>
          
            <button 
              onMouseDown={(e)=>{
                e.preventDefault();   
                intervalId.current = setInterval(()=>{setImageScale((prevVal) => prevVal + 0.02)},100)
              }} 
              onMouseUp={(e)=>{
                e.preventDefault();   
                clearInterval(intervalId.current)
              }}
              onClick={(e)=>{
                e.preventDefault();   
                setImageScale((prevVal) => prevVal + 0.01)
                }}>Zoom In</button>
            <button 
              onMouseDown={(e)=>{
                e.preventDefault();   
                intervalId.current = setInterval(()=>{setImageScale((prevVal) => prevVal - 0.02)},100)
              }} 
              onMouseUp={(e)=>{
                e.preventDefault();   
                clearInterval(intervalId.current)
              }}
              onClick={(e)=>{
                e.preventDefault();   
                setImageScale((prevVal) => prevVal - 0.01)
                }}>Zoom Out</button>

            <button 
              onMouseDown={(e)=>{
                e.preventDefault();   
                intervalId.current = setInterval(()=>{moveImage(0,-10)},100)
              }} 
              onMouseUp={(e)=>{
                e.preventDefault();   
                clearInterval(intervalId.current)
              }}
              onClick={(e)=>{
                e.preventDefault();   
                moveImage(0,-1)
                }}>Move Up</button>
            <button 
              onMouseDown={(e)=>{
                e.preventDefault();   
                intervalId.current = setInterval(()=>{moveImage(0,10)},100)
              }} 
              onMouseUp={(e)=>{
                e.preventDefault();   
                clearInterval(intervalId.current)}}
              onClick={(e)=>{
                e.preventDefault();   
                moveImage(0,1)}}>Move Down</button>
              <button 
              onMouseDown={(e)=>{
                e.preventDefault();   
                intervalId.current = setInterval(()=>{moveImage(10,0)},100)}} 
              onMouseUp={(e)=>{
                e.preventDefault();   
                clearInterval(intervalId.current)}}
              onClick={(e)=>{
                e.preventDefault();   
                moveImage(1,0)}}>Move Right</button>
              <button 
              onMouseDown={(e)=>{
                e.preventDefault();   
                intervalId.current = setInterval(()=>{moveImage(-10,0)},100)}} 
              onMouseUp={(e)=>{
                e.preventDefault();   
                clearInterval(intervalId.current)}}
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
              <label>
                <input
                  type="checkbox"
                  checked={isImageHidden}
                  onChange={()=>{setIsImageHidden((prev) => !prev)}}
                />
                Hide Image
              </label>
              
            </fieldset>                   
          </form>
          :null
        }
        
        

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
            backgroundRepeat: 'no-repeat',
            opacity:isImageHidden ? 0 : 1
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
              opacity:0.5 //this style can not be changed upon state change
            }}
            scrollWheelZoom={false}
            >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {/* temporary zone */}
            {tmpZoneLatlngIds.length > 0 && <Polygon positions={getLatlngsFromIds(tmpZoneLatlngIds)} />}
            {/* main polygons and markers */}    
            {
              districts.map((district,dindex) =>{     
                return(
                  <div key={dindex}>
                  {
                    district.map((zone,zindex) =>{               
                      return (
                        <div key={zindex}>                          
                          <Polygon positions={getLatlngsFromIds(zone)}>
                            <Tooltip>{`${dindex + 1} - ${zindex + 1}`}</Tooltip>
                          </Polygon>
                          {
                            zone.map((latlngId,index)=>{
                              return(
                                <Marker key={index} 
                                  position={getLatlngsFromIds(latlngId)} 
                                  draggable={true}
                                  eventHandlers={{
                                    click: (e) => {
                                      console.log('marker clicked')
                                      prepareTmpZoneLatlngIds(e)
                                    },
                                    dragend: (e) => {
                                      const { lat, lng } = e.target.getLatLng();
                                      // Do something with the updated latlng after dragging
                                      console.log('marker dragged to:',[lat,lng])
                                      //update latlngs object
                                      setLatlngs(prevArray => {
                                        return prevArray.map(obj => {
                                          if (obj.id === latlngId) {
                                            return { ...obj, latlng: [lat,lng]};
                                          }
                                          return obj;
                                        });
                                      });
                                    }
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
                // console.log('clicked on map.')
                prepareTmpZoneLatlngIds(e)
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
            <legend>Districts</legend>              
              <div>
                <span>{`${tmpZoneLatlngIds.length} points selected.`}</span>
                {tmpZoneLatlngIds.length > 0 ?
                  <button onClick={(e) => {
                    e.preventDefault()
                    undoTempZoneLatlngIds()
                    }}>undo</button>
                :null}                
              </div>
              <div>
                {districts.length > 0 ?
                <div>
                  <button onClick={(e)=>{
                    e.preventDefault()
                    addZoneLatlngIdsToDistrict()
                    }}>add zone</button>
                    <span> to district </span>
                    <select 
                      onChange={(e)=>{setSelectedDistrict(parseInt(e.target.value))}} >
                      {
                        districts.map((district,index)=>{
                          return(
                            <option key={index} value={index}>{index + 1}</option>
                          )
                        })
                     
                      }
                    </select>
                    <p>{`district ${selectedDistrict + 1} has been selected`}</p>
                 </div>
                
                  :
                  <p>please add a district before assigning a zone to a district</p>
                }
              </div>     
              <div>
                <button onClick={(e)=>{
                  e.preventDefault();
                  let tmp = [...districts]
                  tmp.push([])
                  setDistricts(tmp)
                }}>
                  add district
                </button>
              </div>               

              {
                districts.length > 0 ? 
                <ol>
                {districts.map((district, dindex) => {
                  return (
                    <div key={dindex}>
                      <span>{`district ${dindex + 1} :`}</span>
                      <button
                        onClick={(e) => {
                          if (window.confirm("Are U sure?")){
                            e.preventDefault()
                            let tmp = [...districts]
                            tmp.splice(dindex, 1)
                            setDistricts(tmp);
                          }                    
                        }}
                      >
                        delete
                      </button>
                      <ol>
                      {district.map((zone, zindex) => {
                        return (
                          <div key={zindex}>
                            <li>
                              {JSON.stringify(getLatlngsFromIds(zone)).substring(0, 30) + "..."}
                              <button
                                onClick={(e) => {
                                  if (window.confirm("Are U sure?")) {
                                    e.preventDefault()
                                    let tmp = [...districts]
                                    tmp[dindex].splice(zindex, 1)
                                    setDistricts(tmp);
                                  }                             
                                }}
                              >
                                delete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (zindex > 0) { // Check if the zone is not already the first zone
                                    const tmp = [...districts];
                                    const zoneToMoveUp = tmp[dindex].splice(zindex, 1)[0];
                                    tmp[dindex].splice(zindex - 1, 0, zoneToMoveUp);
                                    setDistricts(tmp);
                                  }
                                }}
                              >
                                Move Up
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  const tmp = [...districts];
                                  const district = tmp[dindex];
                                  if (zindex < district.length - 1) { // Check if the zone is not already the last element
                                    const zoneToMoveDown = district.splice(zindex, 1)[0];
                                    district.splice(zindex + 1, 0, zoneToMoveDown);
                                    setDistricts(tmp);
                                  }
                                }}
                              >
                                Move Down
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
                <p>no district found.</p>
              }    
              {/* save districts */}
              {districts.length > 0 ?
              <div>
                <button
                onClick={(e)=>{
                  e.preventDefault()                 
                  localStorage.setItem('GeoData',JSON.stringify({
                    districts : districts,
                    latlngs:latlngs
                  }))
                  window.alert('Geo Data Saved.')
                }}
                >
                  Save Geo Data
                </button>
                <button
                  onClick={(e)=>{
                  e.preventDefault()      
                  if (window.confirm("Are U sure?")){
                    localStorage.removeItem('GeoData')
                    setDistricts([])
                    window.alert('Saved Geo Data Removed.')
                  }             
                }}
                >
                  reset
                </button>
                <button
                  onClick={(e)=>{
                  e.preventDefault()      
                  navigator.clipboard.writeText(
                    JSON.stringify({
                      districts : districts,
                      latlngs:latlngs
                    })
                  )
                  .then(() => {
                    window.alert('Geo Data copied to clipboard.')
                  })
                  .catch((error) => {
                    window.alert('There was an error while copying Geo data to clipboard.')
                    console.error("Failed to copy: ", error);
                  });
                }}
                >
                  Export Geo Data
                </button>
                <button
                  onClick={(e)=>{
                  e.preventDefault()    
                  const districtsAsArrayOfLatlngs = districts.map(subArray => {
                    return subArray.map(innerArray => {
                      return innerArray.map(number => {
                        const latlngObject = latlngs.find(obj => obj.id === number);
                        return latlngObject ? latlngObject.latlng : number;
                      });
                    });
                  });
                  
                  navigator.clipboard.writeText(
                    JSON.stringify(districtsAsArrayOfLatlngs)
                  )
                  .then(() => {
                    window.alert('Latlngs copied to clipboard.')
                  })
                  .catch((error) => {
                    window.alert('There was an error while copying latlngs to clipboard.')
                    console.error("Failed to copy: ", error);
                  });
                }}
                >
                  Export districts as array of latlngs
                </button>
                <button
                  onClick={(e)=>{
                  e.preventDefault()    
                  const transformedObject = {};

                  districts.forEach((subArray, index) => {
                    transformedObject[index + 1] = {
                      coordinates: [],
                      zones: {}
                    };

                    subArray.forEach((innerArray, innerIndex) => {
                      const key = `${index + 1}-${innerIndex + 1}`;
                      const coordinates = innerArray.map(number => {
                        const latlngObject = latlngs.find(obj => obj.id === number);
                        return latlngObject ? latlngObject.latlng : null;
                      });

                      transformedObject[index + 1].zones[key] = {
                        coordinates: coordinates.filter(Boolean)
                      };
                    });
                  });
                  
                  navigator.clipboard.writeText(
                    JSON.stringify(transformedObject)
                  )
                  .then(() => {
                    window.alert('Object copied to clipboard.')
                  })
                  .catch((error) => {
                    window.alert('There was an error while copying object to clipboard.')
                    console.error("Failed to copy: ", error);
                  });
                }}
                >
                  Export districts as nested objects
                </button>
              </div>
              :null}
              
          </fieldset>                   
        </form>        
    </div>
  );
}


export default App;
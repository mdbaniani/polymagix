import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polygon, Marker, useMapEvent, Tooltip, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { latLng } from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import MapEvents from "./Components/MapEvents";
import SelectedMarkerIcon from "./Components/SelectedMarkerIcon";
import DefaultMarkerIcon from "./Components/DefaultMarkerIcon";

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
  const [districts,setDistricts] = useState([])//array of district objects
  const [tmpZoneLatlngIds, setTmpZoneLatlngIds] = useState([]);
  const [imageUrl, setImageUrl] = useState(defaultSettings && defaultSettings.imageUrl ? defaultSettings.imageUrl : null);
  const [isImageLocked,setIsImageLocked] = useState(defaultSettings ? defaultSettings.isImageLocked : false)
  const [isImageHidden,setIsImageHidden] = useState(false)
  const [imageRotation,setImageRotation] = useState(0)
  const [imageScale,setImageScale] = useState(1)
  const [imageTranslateX,setImageTranslateX] = useState(0)
  const [imageTranslateY,setImageTranslateY] = useState(0)
  const [predefinedGeoData,setPredefinedGeoData] = useState()
  const [selectedDistrictId,setSelectedDistrictId] = useState(1)
  const [latlngs,setLatlngs] = useState([])
  const [selectedPolygon,setSelectedPolygon] = useState(null)
  const [selectedMarkerIndex,setSelectedMarkerIndex] = useState(null)


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
  const findZoneByDistrictAndZoneId = (districtId, zoneId) => {
    // Find the district that matches the given districtId
    const district = districts.find(item => item.id === districtId);
    if (district) {
      // Find the zone that matches the given zoneId within the district
      const zone = district.zones.find(item => item.id === zoneId);
      if (zone) {
        return zone;
      }
    }
    return null; // Return null if the district or zone is not found
  }
  const checkKeyPress = (event) => {
    if (event.key === 'Delete') {
      // Perform your desired action here
      // console.log('Delete key pressed!');
      // console.log('districts',districts)
      // console.log('selected polygon',selectedPolygon)
      // console.log('selected marker index',selectedMarkerIndex)

      if(selectedPolygon !== null && selectedMarkerIndex !== null){
        const newDistricts = [...districts]
        const districtId = selectedPolygon[0]
        const zoneId = selectedPolygon[1]
        const markerIndex = selectedMarkerIndex      
        const zone = findZoneByDistrictAndZoneId(districtId,zoneId)
        // console.log(newDistricts)
        // console.log(districtId)
        // console.log(zoneId)
        // console.log(zone)
        // return
        zone.pointIds.splice(markerIndex, 1)      
        setDistricts(newDistricts)
      }
      //reset marker selection
      setSelectedMarkerIndex(null)

    }
  }
  const findHighestLatlngId = () =>{
    const objectWithHighestId = latlngs.reduce((prev, current) =>
    prev.id > current.id ? prev : current
    );

    return objectWithHighestId.id
  }

  const addLatLng = (latlng) => {
    const newLatlngs = [...latlngs];
    const id = newLatlngs.length > 0 ? newLatlngs[newLatlngs.length - 1].id + 1 : 1;
    const newLatlng = { id: id, latlng: latlng };
    newLatlngs.push(newLatlng);
    console.log(newLatlngs)
    setLatlngs(newLatlngs);

    return newLatlng;
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
  
  
  const handleOnMapClick = (e) => {
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
      const newLatlng = addLatLng(clickedLatlng)
      myLatlngId = newLatlng.id
    }
   
    //if polygon and marker selected, add point next to selected polygon
    if(selectedPolygon !== null && selectedMarkerIndex !== null){
      const newDistricts = [...districts]
      const districtId = selectedPolygon[0]
      const zoneId = selectedPolygon[1]
      const markerIndex = selectedMarkerIndex      
      const zone = findZoneByDistrictAndZoneId(districtId,zoneId)
      zone.pointIds.splice(markerIndex + 1, 0 , myLatlngId)      
      setDistricts(newDistricts)
    }else{
      //add my latlng's id to new zone array variable
      const newZone = [...tmpZoneLatlngIds, myLatlngId];
      console.log('new zone ids',newZone)
      // console.log('new zone latlngs',getLatlngsFromIds(newZone))

      setTmpZoneLatlngIds(newZone);
    }        
  };

  const createDistrict = () => {
    const districtId = districts.length + 1;
    const newDistrict = { id: districtId, zones: [] };
    setDistricts([...districts, newDistrict]);
  };
  const deleteDistrict = (districtId) => {
    const updatedDistricts = districts.filter((district) => district.id !== districtId)
      .map((district, index) => ({ ...district, id: index + 1 }));
    setDistricts(updatedDistricts);
    setSelectedDistrictId(1)
  };
  const addZoneToDistrict = (pointIds, districtId) => {
    if(pointIds.length < 3) {
      return window.alert('at least 3 points should be specified.')
    }
    const updatedDistricts = [...districts];
    const districtIndex = updatedDistricts.findIndex((district) => district.id === districtId);
    const zoneId = updatedDistricts[districtIndex].zones.length + 1;    
    const newZone = { id: zoneId, pointIds };
    updatedDistricts[districtIndex].zones.push(newZone);
    console.log('updated districts',updatedDistricts)
    setDistricts(updatedDistricts);
    setTmpZoneLatlngIds([])//empty temp zone
  };
  const moveZoneUp = (districtId, zoneId) => {
    const updatedDistricts = [...districts];

    const districtIndex = updatedDistricts.findIndex((district) => district.id === districtId);
    const zoneIndex = updatedDistricts[districtIndex].zones.findIndex((zone) => zone.id === zoneId);

    if (zoneIndex > 0) {
      const zoneToMove = updatedDistricts[districtIndex].zones.splice(zoneIndex, 1)[0];
      updatedDistricts[districtIndex].zones.splice(zoneIndex - 1, 0, zoneToMove);

      // Reassign zone IDs
      updatedDistricts[districtIndex].zones.forEach((zone, index) => {
        zone.id = index + 1;
      });

      setDistricts(updatedDistricts);
    }
  };
  const moveZoneDown = (districtId, zoneId) => {
    const updatedDistricts = [...districts];

    const districtIndex = updatedDistricts.findIndex((district) => district.id === districtId);
    const zoneIndex = updatedDistricts[districtIndex].zones.findIndex((zone) => zone.id === zoneId);

    if (zoneIndex < updatedDistricts[districtIndex].zones.length - 1) {
      const zoneToMove = updatedDistricts[districtIndex].zones.splice(zoneIndex, 1)[0];
      updatedDistricts[districtIndex].zones.splice(zoneIndex + 1, 0, zoneToMove);

      // Reassign zone IDs
      updatedDistricts[districtIndex].zones.forEach((zone, index) => {
        zone.id = index + 1;
      });

      setDistricts(updatedDistricts);
    }
  };

  const deleteZone = (districtId, zoneId) => {
    const updatedDistricts = districts.map((district) => {
      if (district.id === districtId) {
        const updatedZones = district.zones.filter((zone) => zone.id !== zoneId);
        return {
          ...district,
          zones: updatedZones.map((zone, index) => ({
            ...zone,
            id: index + 1
          }))
        };
      }
      return district;
    });

    setDistricts(updatedDistricts);
  };

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

  const saveGeoData = () => {
    localStorage.setItem('GeoData',JSON.stringify({
      districts : districts,
      latlngs:latlngs
    }))
    window.alert('Geo Data Saved.')
  }

  const resetGeoData = () => {
    if (window.confirm("Are U sure?")){
      localStorage.removeItem('GeoData')
      setDistricts([])
      window.alert('Saved Geo Data Removed.')
    }     
  }

  const exportGeoData = () =>{
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
  }

  const exportDistrictsAsNestedObjects = () => {

    const addLeadingZero = (number) => {
      if (number < 10) {
        return '0' + number;
      }
      return number.toString();
    }

    var newDistricts = {};

  // Iterate over each element in the object
  for (var i = 0; i < districts.length; i++) {
    var element = districts[i];

    // Get the id and zones from the element
    var id = element.id;
    var zones = element.zones;

    // Create the newDistricts object if it doesn't exist
    if (!newDistricts[id]) {
      newDistricts[id] = {
        coordinates: [],
        blocks: {}
      };
    }

    // Iterate over each zone
    for (var j = 0; j < zones.length; j++) {
      var zone = zones[j];

      // Get the zone id and pointIds
      var zoneId = zone.id;
      var pointIds = zone.pointIds;

      // Create the block object if it doesn't exist
      if (!newDistricts[id].blocks[`${id}-${addLeadingZero(zoneId)}`]) {
        newDistricts[id].blocks[`${id}-${addLeadingZero(zoneId)}`] = {
          coordinates: [getLatlngsFromIds(pointIds)]
        };
      } else {
        // If the block object already exists, push the coordinates
        newDistricts[id].blocks[`${id}-${addLeadingZero(zoneId)}`].coordinates.push(getLatlngsFromIds(pointIds));
      }
    }
  }

  // return newDistricts;
    
    navigator.clipboard.writeText(
      JSON.stringify(newDistricts)
    )
    .then(() => {
      window.alert('Object copied to clipboard.')
    })
    .catch((error) => {
      window.alert('There was an error while copying object to clipboard.')
      console.error("Failed to copy: ", error);
    });
  }

  const moveDistrictAndZoneToEnd = (districtId, zoneId) => {
    setDistricts(prevDistricts => {
      const updatedDistricts = [...prevDistricts];

      const districtIndex = updatedDistricts.findIndex(
        district => district.id === districtId
      );

      if (districtIndex === -1) {
        console.error('District not found');
        return prevDistricts;
      }

      const district = updatedDistricts.splice(districtIndex, 1)[0];
      updatedDistricts.push(district);

      const zoneIndex = district.zones.findIndex(zone => zone.id === zoneId);

      if (zoneIndex === -1) {
        console.error('Zone not found');
        return prevDistricts;
      }

      const zone = district.zones.splice(zoneIndex, 1)[0];
      district.zones.push(zone);

      return updatedDistricts;
    });
  }

  return (
    <div className="App" onKeyDown={checkKeyPress}>
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
            {tmpZoneLatlngIds.length > 0 && <Polygon className="tmp-polygon" positions={getLatlngsFromIds(tmpZoneLatlngIds)} />}
            {/* main polygons and markers */}    
            {
              districts.map((district,dindex) =>{     
                return(
                  <div key={dindex}>
                  {
                    district.zones.map((zone,zindex) =>{               
                      return (
                        <div 
                          key={zindex} 
                          className={zindex === 0 ? 'bring-to-front' : ''}
                                                   
                          >                          
                          <Polygon 
                            positions={getLatlngsFromIds(zone.pointIds)} 
                            eventHandlers={{
                              click: (event) => {
                                if(selectedPolygon !== null && selectedPolygon[0] === district.id && selectedPolygon[1] === zone.id){
                                  setSelectedPolygon(null)
                                  setSelectedMarkerIndex(null)
                                }else{
                                  setSelectedPolygon([district.id,zone.id])
                                  setSelectedMarkerIndex(null)
                                  //move polygon to surface
                                  moveDistrictAndZoneToEnd(district.id, zone.id);
                                }
                              }
                            }}
                            pathOptions={{
                              color: selectedPolygon !== null && selectedPolygon[0] === district.id && selectedPolygon[1] === zone.id ? 'red' : '#3388ff'
                            }}>
                            <Tooltip>{`${district.id} - ${zone.id}`}</Tooltip>
                          </Polygon>
                          {
                            zone.pointIds.map((latlngId,mindex)=>{
                              return(
                                <Marker 
                                  key={mindex} 
                                  position={getLatlngsFromIds(latlngId)} 
                                  draggable={true}                                
                                  icon={
                                    selectedPolygon !== null &&
                                    selectedPolygon[0] === district.id &&
                                    selectedPolygon[1] === zone.id &&
                                    selectedMarkerIndex !== null &&
                                    selectedMarkerIndex === mindex  ? 
                                    SelectedMarkerIcon :
                                    DefaultMarkerIcon
                                    }
                                  eventHandlers={{
                                    click: (e) => {

                                      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
                                        // console.log('Marker clicked with Ctrl key');
                                        // Handle Ctrl + click event

                                        if(selectedPolygon === null){
                                          console.log('no polygon is selected.')
                                          return
                                        }

                                        if(
                                          selectedPolygon !== null &&
                                          selectedPolygon[0] !== district.id ||
                                          selectedPolygon[1] !== zone.id){
                                            console.log('selecting marker on an unselected polygon')
                                            return
                                          }

                                        if(
                                          selectedPolygon !== null &&
                                          selectedPolygon[0] === district.id &&
                                          selectedPolygon[1] === zone.id &&
                                          selectedMarkerIndex !== null &&
                                          selectedMarkerIndex === mindex                                          
                                          ) {
                                            setSelectedMarkerIndex(null)
                                          } else {
                                            setSelectedMarkerIndex(mindex)
                                          }                                        
                                      }else{
                                        handleOnMapClick(e)
                                      }
                                    
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
                // console.log('clicked on map.',e)
                // Check if the target element is a polygon
                const clickedLayer = e.originalEvent.target;
    
                if (clickedLayer.tagName === "path" && 
                clickedLayer.getAttribute("class").includes("leaflet-interactive") &&
                !clickedLayer.getAttribute("class").includes("tmp-polygon")) {
                  // Skip calling handleOnMapClick for polygons except for tmp polygon
                  return;
                }      

                handleOnMapClick(e)
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
                    addZoneToDistrict(tmpZoneLatlngIds,selectedDistrictId)
                    }}>add zone</button>
                    <span> to district </span>
                    <select 
                      onChange={(e)=>{setSelectedDistrictId(parseInt(e.target.value))}} >
                      {
                        districts.map((district,index)=>{
                          return(
                            <option key={district.id} value={district.id}>{district.id}</option>
                          )
                        })
                     
                      }
                    </select>
                 </div>
                
                  :
                  <p>please add a district before assigning a zone to a district</p>
                }
              </div>     
              <div>
                <button onClick={(e)=>{
                  e.preventDefault();
                  createDistrict()
                }}>
                  add district
                </button>
              </div>               

              {
                districts.length > 0 ? 
                <ol>
                {districts.map((district, dindex) => {
                  return (
                    <div key={district.id}>
                      <span>{`district ${district.id} :`}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          if (window.confirm("Are U sure?")){
                            e.preventDefault()
                            deleteDistrict(district.id)
                          }        
                        }}
                      >
                        delete
                      </button>
                      <ul>
                      {district.zones.map((zone, zindex) => {
                        return (
                          <div key={zone.id}>
                            <li>
                              {JSON.stringify(getLatlngsFromIds(zone.pointIds)).substring(0, 30) + "..."}
                              <button
                                onClick={(e) => {
                                  if (window.confirm("Are U sure?")) {
                                    e.preventDefault()
                                    deleteZone(district.id,zone.id)
                                  }                             
                                }}
                              >
                                delete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  moveZoneUp(district.id,zone.id)
                                }}
                              >
                                Move Up
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  moveZoneDown(district.id,zone.id)
                                }}
                              >
                                Move Down
                              </button>
                            </li>
                          </div>                    
                        );                  
                      })}
                      </ul>   

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
                  saveGeoData()
                }}
                >
                  Save Geo Data
                </button>
                <button
                  onClick={(e)=>{
                  e.preventDefault()      
                  resetGeoData()        
                }}
                >
                  Reset 
                </button>
                <button
                  onClick={(e)=>{
                  e.preventDefault()      
                  exportGeoData()
                }}
                >
                  Export Geo Data
                </button>
                
                <button
                  onClick={(e)=>{
                  e.preventDefault()    
                  exportDistrictsAsNestedObjects()
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
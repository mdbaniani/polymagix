import React, { useEffect } from "react";
import { useMapEvents } from "react-leaflet";

const MapEvents = (props) => {

    const previousZoomRef = React.useRef();
    const lastPoint = React.useRef({x:0,y:0})

    useEffect(()=>{
        previousZoomRef.current = props.initialZoom
    },[])


    const map = useMapEvents({        
        click(e) {
            // console.log(e.latlng);
            props.onClick(e)
        },
        zoomend: (event) => {
            const currentZoom = event.target.getZoom();
            const previousZoom = previousZoomRef.current;
      
            if (currentZoom > previousZoom) {
              console.log('Map zoomed in');
              props.onZoomIn()
            } else if (currentZoom < previousZoom) {
              console.log('Map zoomed out');
              props.onZoomOut()
            }
      
            previousZoomRef.current = currentZoom;
        },
        drag: (e) =>{
           
        },
        dragend:(e) =>{
            const currentPoint = e.target._getMapPanePos();
            if (lastPoint) {
                const dx = currentPoint.x - lastPoint.current.x;
                const dy = currentPoint.y - lastPoint.current.y;
                console.log(`Map moved by: ${dx} pixels horizontally, ${dy} pixels vertically`);           
                props.onMapMove(dx/props.imageScale,dy/props.imageScale)                         
            }
            lastPoint.current = currentPoint
        }
    });
    return null;
};

export default MapEvents
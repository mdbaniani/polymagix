import React, { useEffect } from "react";
import { useMapEvents } from "react-leaflet";

const MapEvents = (props) => {

    


    const map = useMapEvents({        
        click(e) {
            props.onClick(e)
        },
        zoomend: (e) => {
            props.onZoomEnd(e)            
        },
        drag: (e) =>{
           
        },
        dragend:(e) =>{
            props.onDragEnd(e)            
        }
    });
    return null;
};

export default MapEvents
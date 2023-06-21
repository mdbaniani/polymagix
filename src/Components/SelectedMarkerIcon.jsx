import L from 'leaflet';
// Create a custom icon
const SelectedMarkerIcon = L.icon({
  iconUrl: require('../images/custommarker.png'),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});


export default SelectedMarkerIcon

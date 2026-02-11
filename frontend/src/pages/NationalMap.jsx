import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../api/axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

export default function NationalMap() {
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get("/map").then((res) => setData(res.data));
  }, []);

  const getColor = (risk) => {
    if (risk === "HIGH") return "red";
    if (risk === "MEDIUM") return "orange";
    return "green";
  };

  const getRiskIcon = (risk) => {
    const level = risk === "HIGH" ? "high" : risk === "MEDIUM" ? "medium" : "low";

    return L.divIcon({
      className: `risk-marker risk-marker--${level}`,
      html: "",
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -8]
    });
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">
        National Medicine Monitoring Map
      </h1>

      <div className="map-shell">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: "70vh", minHeight: "720px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            detectRetina
            maxZoom={19}
          />

          {data.map((hospital, idx) => (
            <Marker
              key={idx}
              position={[hospital.lat, hospital.lng]}
              icon={getRiskIcon(hospital.risk)}
            >
              <Popup>
                <b>{hospital.hospital}</b>
                <br />
                {hospital.city}
                <br />
                Risk:{" "}
                <span style={{ color: getColor(hospital.risk) }}>
                  {hospital.risk}
                </span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Layout>
  );
}

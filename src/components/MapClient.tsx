"use client";

import "leaflet/dist/leaflet.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";
import { useEffect, useState  } from "react";


interface Project {
  _id: string;
  firstName: string;
  lastName: string;
  title: string;
  objective: string;
  description: string;
  category: string;

  location: {
    coordinates: [number, number];
    address: string;
  };

  pictureOfSuccess?: {
    url: string;
  };

  creator?: {
    _id: string;
    firstName?: string;
    lastName?: string;
  };
}

interface Props {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const customIcon = new L.Icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/684/684908.png",

  iconSize: [40, 40],

  iconAnchor: [20, 40],

  popupAnchor: [0, -40],
});

export default function MapClient({
  projects,
  onSelectProject,
}: Props) {

  const [isMounted, setIsMounted] =
    useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <MapContainer
      center={[22.5937, 78.9629]}
      zoom={5}
      minZoom={4}
      maxZoom={18}
      scrollWheelZoom={true}
      className="h-screen w-full z-0"
    >

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {projects.map((project) => (

        <Marker
            key={project._id}
            icon={customIcon}
            position={[
                project.location.coordinates[1],
                project.location.coordinates[0],
            ]}
            eventHandlers={{
                click: () => onSelectProject(project),

                mouseover: (e) => {
                e.target.openPopup();
                },

                mouseout: (e) => {
                e.target.closePopup();
                },
            }}
            >

            <Popup closeButton={false}>
                <div className="min-w-45">

                <h2 className="font-bold text-base">
                    {project.title}
                </h2>

                <p className="text-sm text-gray-600 mt-1">
                    {project.category}
                </p>

                <p className="text-xs text-gray-500 mt-2">
                    {project.location.address}
                </p>

                </div>
            </Popup>

            </Marker>
      ))}
    </MapContainer>
  );
}
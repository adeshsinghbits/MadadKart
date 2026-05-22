// app/map/page.tsx - FINAL FIX (Remove Direct L Import)
"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  useRef,
} from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { FaThumbsUp, FaHandsHelping, FaUserCircle } from "react-icons/fa";
import {
  Search,
  X,
  Menu,
  Heart,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search as SearchIcon } from "react-feather";

const MapClient = dynamic(
  () => import("@/components/MapClient"),
  {
    ssr: false,
  }
);

// Types
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

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  handleSearch: (e: ChangeEvent<HTMLInputElement>) => void;
  filteredSuggestions: string[];
  handleSelectSuggestion: (suggestion: string) => void;
}

const organizationTypes = ["Human", "Animal", "Plant"];

const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  onClose,
  searchQuery,
  handleSearch,
  filteredSuggestions,
  handleSelectSuggestion,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-[57px] left-[240px] z-50 w-[500px] h-[45vh] bg-white border border-gray-300 shadow-lg rounded-xl">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        &times;
      </button>

      <div className="p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search Projects..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full h-10 text-md border rounded-full px-4"
          />
        </div>
      </div>

      <div className="h-[calc(50vh-125px)] overflow-y-auto px-4">
        {filteredSuggestions.length === 0 ? (
          <p>No results found.</p>
        ) : (
          <ul>
            {filteredSuggestions.map((suggestion) => (
              <li
                key={suggestion}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="flex items-center cursor-pointer hover:bg-blue-100 py-2"
              >
                <SearchIcon className="mr-2 h-4 w-4 text-gray-500" />
                <span className="flex-1">{suggestion}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default function MapPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [markerIcon, setMarkerIcon] = useState<any>(null);

  // Only render on client and load Leaflet here
  useEffect(() => {
    setIsClient(true);

    // Lazy load Leaflet only on client
    import("leaflet").then((L) => {
      const icon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/9356/9356230.png",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });
      setMarkerIcon(icon);
    });
  }, []);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        const data = await response.json();
        if (data.projects) {
          const validProjects = data.projects.filter(
            (project: any) =>
              project.location?.coordinates?.[0] &&
              project.location?.coordinates?.[1] &&
              !isNaN(project.location.coordinates[0]) &&
              !isNaN(project.location.coordinates[1])
          );
          setProjects(validProjects);
          setFilteredProjects(validProjects);

          // Calculate bounds using lazy-loaded L
          if (validProjects.length > 0 && isClient) {
            import("leaflet").then((L) => {
              const bounds = L.latLngBounds(
                validProjects.map((p: Project) => [
                  p.location.coordinates[1],
                  p.location.coordinates[0],
                ])
              );
              setMapBounds(bounds);
            });
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    if (isClient) {
      fetchProjects();
    }
  }, [isClient]);

  // Search handler
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    const filtered = projects.filter(
      (project) =>
        project.title.toLowerCase().includes(value.toLowerCase()) ||
        project.category.toLowerCase().includes(value.toLowerCase()) ||
        project.description?.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredProjects(filtered);
    setFilteredSuggestions(filtered.map((project) => project.title));
  };

  // Category filter
  useEffect(() => {
    if (selectedType) {
      const filtered = projects.filter(
        (project) => project.category === selectedType
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [selectedType, projects]);

  const handleSelectSuggestion = (value: string) => {
    setSearchQuery(value);
    const filtered = projects.filter((project) =>
      project.title.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredProjects(filtered);
  };

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobileDevice(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isClient || !markerIcon) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900">
        <p className="text-white text-lg">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative bg-gray-900">
      {/* Map Container */}
      <div className="absolute inset-0 z-0">
      <MapClient
        projects={filteredProjects}
        onSelectProject={setSelectedProject}
      />
    </div>

      {/* Selected Project Info */}
      {selectedProject && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-16 right-4 transform -translate-x-1/2 z-20 w-96 mx-auto"
        >
          <Card className="bg-white border-2 border-gray-500 shadow-lg">
            <CardHeader className="px-4 py-2 bg-linear-to-r from-gray-500 to-gray-700">
              <h2 className="text-lg font-semibold text-white">
                {selectedProject.firstName} wants {selectedProject.objective}
              </h2>
              <Badge className="mt-2 bg-transparent text-white w-fit">
                {selectedProject.category}
              </Badge>
            </CardHeader>

            <CardContent className="p-4 border-b border-gray-200">
              <CardDescription>{selectedProject.description}</CardDescription>
            </CardContent>
           
            <CardTitle className="flex rounded-4xl mx-2 bg-gray-400"> 
              <span className="bg-amber-200 rounded-4xl p-2">Location :  </span><p className="text-sm p-2 text-gray-600">{selectedProject.location.address}</p>
            </CardTitle>
            <div className="p-4 flex  gap-3">
              <Link href={`/projects/${selectedProject._id}`} className="w-full">
                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                  <FaHandsHelping className="h-4 w-4 mr-2" />
                  Support
                </Button>
              </Link>
              <Link href={`/profile/${selectedProject.creator?._id}`} className="w-full">
                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                  <FaUserCircle className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </Link>
              <div className="flex justify-between">
                <Button variant="ghost" size="icon">
                  <Heart className="h-6 w-6 text-red-500" />
                </Button>
                <Button variant="ghost" size="icon">
                  <FaThumbsUp className="h-6 w-6 text-blue-600" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProject(null)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="fixed top-20 right-0 z-10  px-4">
        <div className="text-sm w-40 font-semibold text-white bg-blue-600 px-4 py-2 rounded-full shadow-md">
          Total Projects: {filteredProjects.length}
        </div>  
      </div>

      {/* Create & Search Buttons */}
      <div className="fixed bottom-4 left-8 z-10 sm:flex-col space-x-2">
        <Link href="/create-project">
          <Button className="py-7 lg:px-8 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg">
            <Plus className="h-6 w-6 lg:mr-2" />
            Create Project
          </Button>
        </Link>

        <Button
          className="py-7 lg:px-8 px-4  bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          <Search className="lg:mr-2 h-4 w-4" />
          Search Projects
        </Button>
      </div>

      {/* Search Dialog */}
      {isSearchOpen && (
        <CustomDialog
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          searchQuery={searchQuery}
          handleSearch={handleSearch}
          filteredSuggestions={filteredSuggestions}
          handleSelectSuggestion={handleSelectSuggestion}
        />
      )}
    </div>
  );
}
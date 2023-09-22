import {
  Button,
  Box,
  Container,
  Typography,
  SelectChangeEvent,
  OutlinedInput,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link } from "../components/Link";
import { LINKS } from "./links";
import { useState, useEffect } from "react";
import { LocationOn, ArrowForward } from "@mui/icons-material";

export const Competitions = () => {
  const { t } = useTranslation();

  const [competitionList, setCompetitionList] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [distance, setDistance] = useState<number>(0);
  const [displayLocation, setDisplayLocation] = useState("");
  const [locationInfo, setLocationInfo] = useState<any>({});
  const [filteredComps, setFilteredComps] = useState<any[]>([]);
  const [invalidLocation, setInvalidLocation] = useState(false);
  const [invalidLocationName, setInvalidLocationName] = useState("");
  const [noCompetitionsFound, setNoCompetitionsFound] = useState(false);

  // Get a list of announced competitions within Canada
  const getCompetitions = async () => {
    const response = await fetch(LINKS.WCA.API.COMPETITION_LIST);
    return await response.json();
  };

  // Hook to update the competitions displayed on the site, and filter out any past competitions
  useEffect(() => {
    const getCompetitionList = async () => {
      const competitions = await getCompetitions();
      setCompetitionList(competitions);
      setIsLoading(false);
      // The WCA's list can sometimes be cached, so remove past compeitions
      const filteredCompetitions = competitions.filter((competition: any) => {
        const endDate = new Date(competition.end_date + "T12:00:00.000Z");
        return endDate > new Date();
      });
      setFilteredComps(filteredCompetitions);
    };
    getCompetitionList();
  }, []);

  // Event handler for distance dropdown
  const handleDistanceChange = (event: SelectChangeEvent) => {
    let newDistance = parseInt(event.target.value, 10);
    setDistance(newDistance);
    filterComps(locationInfo, newDistance);
    console.log(filteredComps);
  };

  // Event handler for postal code input field
  const handleInputChange = (event: any) => {
    setDisplayLocation(event.target.value);
  };

  // Handle if the user selects location automatically
  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude,
          );
        },
        (error) => {
          console.error("Error getting user's location:", error.message);
          // Handle the error gracefully if needed
        },
      );
    } else {
      console.error("Geolocation is not supported in this browser.");
      // Handle the lack of geolocation support gracefully if needed
    }
  };

  // Find postal code to display if user selects locaiton automatically
  const reverseGeocode = async (latitude: number, longitude: number) => {
    const apiUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&addressdetails=1&format=jsonv2`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    setLocationInfo(data);
    setDisplayLocation(data.address.city);
  };

  // Find coordinates from postal code
  const geocode = async (location: string) => {
    const apiUrl = `https://nominatim.openstreetmap.org/search?q=${displayLocation}&format=json`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data === undefined || data.length === 0) {
      setInvalidLocation(true);
      setInvalidLocationName(location);
      return null;
    }
    setInvalidLocation(false);
    setLocationInfo(data[0]);
    return data[0];
  };

  // Event handler for the search button, finds the user's coordinates based off their inputted postal code, then filters out competitions
  const handleButtonClick = async (event: any) => {
    let location = locationInfo;
    if (distance !== 0 && locationInfo.name !== displayLocation) {
      location = await geocode(displayLocation);
    }
    setDisplayLocation(location.name);
    filterComps(location, distance);
  };

  // Find the distance in km between two sets of coordinates using Haversine formula
  const findDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const earthRadius = 6371;

    const radLat1 = (Math.PI / 180) * lat1;
    const radLon1 = (Math.PI / 180) * lon1;
    const radLat2 = (Math.PI / 180) * lat2;
    const radLon2 = (Math.PI / 180) * lon2;

    const dLat = radLat2 - radLat1;
    const dLon = radLon2 - radLon1;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
  };

  const filterComps = (location: any, newDistance: number) => {
    let displayedComps = [];
    if (distance === 0) {
      displayedComps = competitionList.filter((competition: any) => {
        const endDate = new Date(competition.end_date + "T12:00:00.000Z");
        return endDate > new Date();
      });
      setFilteredComps(displayedComps);
      setInvalidLocation(false);
      return;
    } else if (locationInfo !== null) {
      for (const competition of competitionList) {
        if (
          findDistance(
            competition.latitude_degrees,
            competition.longitude_degrees,
            location.lat,
            location.lon,
          ) < newDistance &&
          new Date(competition.end_date + "T12:00:00.000Z") > new Date()
        ) {
          displayedComps.push(competition);
        }
      }
      setNoCompetitionsFound(displayedComps.length == 0);
    }
    setFilteredComps(displayedComps);
  };

  return (
    <Container maxWidth="xl" style={{ textAlign: "center" }}>
      <Box marginTop="4rem">
        <Typography component="h1" variant="h3" fontWeight="bold" gutterBottom>
          {t("competition.upcoming")}
        </Typography>
        <Typography gutterBottom sx={{ maxWidth: "md", margin: "0 auto" }}>
          {t("competition.upcomingbody")}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            {t("competition.showonly1")}
            <FormControl sx={{ width: "15ch" }}>
              <InputLabel sx={{ textAlign: "left" }} id="distance-selection">
                {t("competition.distance")}
              </InputLabel>
              <Select
                labelId="distance-selection"
                id="distance-selection"
                value={distance.toString()}
                label="Distnace"
                onChange={handleDistanceChange}
              >
                <MenuItem value={20}>20 km</MenuItem>
                <MenuItem value={50}>50 km</MenuItem>
                <MenuItem value={100}>100 km</MenuItem>
                <MenuItem value={200}>200 km</MenuItem>
                <MenuItem value={500}>500 km</MenuItem>
                <MenuItem value={1000}>1000 km</MenuItem>
                <MenuItem value={0}>Any distance</MenuItem>
              </Select>
            </FormControl>
            {t("competition.showonly2")}
            <FormControl sx={{ minwidth: "50ch" }}>
              <InputLabel htmlFor="location-box">
                {t("competition.postalcode")}
              </InputLabel>
              <OutlinedInput
                error={invalidLocation}
                value={displayLocation}
                onChange={handleInputChange}
                endAdornment={
                  <InputAdornment position="end">
                    <Tooltip title="Use my current location">
                      <IconButton
                        aria-label="get location"
                        onClick={handleGetLocation}
                        edge="end"
                      >
                        <LocationOn />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                }
                label="City or Postal code"
              />
            </FormControl>
            <Button
              onClick={handleButtonClick}
              variant="contained"
              size="large"
            >
              <ArrowForward />
            </Button>
          </Box>
        </Typography>
      </Box>
      {isLoading ? (
        <Box margin="4rem">
          <CircularProgress />
        </Box>
      ) : invalidLocation ? (
        <Typography gutterBottom sx={{ maxWidth: "md", margin: "0 auto" }}>
          {t("competition.locationnotfound", { location: invalidLocationName })}
        </Typography>
      ) : noCompetitionsFound ? (
        <Typography gutterBottom sx={{ maxWidth: "md", margin: "0 auto" }}>
          {t("competition.nonefound", {
            distance: distance,
            location: locationInfo.name,
          })}
        </Typography>
      ) : (
        <Box display="flex" justifyContent="center" flexWrap="wrap">
          {filteredComps
            .slice()
            .reverse()
            .map((item: any, index: any) => (
              <Box margin="1rem" padding="1rem" key={index}>
                <Typography variant="h5" fontWeight="bold">
                  {item.name}
                </Typography>
                <Typography gutterBottom maxWidth="400px">
                  {new Date(item.start_date + "T12:00:00.000Z").toLocaleString(
                    "en-US",
                    { month: "long" },
                  )}
                  {" | "}
                  {item.city}
                </Typography>
                <Button
                  to={`competitions/${item.id}`}
                  component={Link}
                  variant="contained"
                  size="large"
                >
                  {t("competition.learnmore")}
                </Button>
              </Box>
            ))}
        </Box>
      )}
    </Container>
  );
};

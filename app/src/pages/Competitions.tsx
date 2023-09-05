import { Button, Box, Container, Typography, SelectChangeEvent, OutlinedInput, MenuItem, Select, FormControl, InputLabel, CircularProgress, InputAdornment, IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link } from "../components/Link";
import { LINKS } from "./links";
import { useState, useEffect } from "react";
import { LocationOn, ArrowForward } from '@mui/icons-material';

export const Competitions = () => {
  const { t } = useTranslation();

  const [competitionList, setCompetitionList] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true); 
  const [distance, setDistance] = useState<number>(0);
  const [postalCode, setPostalCode] = useState('');
  const [locationInfo, setLocationInfo] = useState<any>({});
  const [filteredComps, setFilteredComps] = useState<any[]>([]);

  let currentDate = new Date()
  
  // Get a list of announced competitions within Canada
  const getCompetitions = async () => {
    const response = await fetch(LINKS.WCA.API.COMPETITION_LIST);
    const data = await response.json();
    return data;
  }

  // Hook to update the competitions displayed on the site, and filter out any past competitions
  useEffect(() => {
    const getCompetitionList = async () => {
      const competitions = await getCompetitions();
      setCompetitionList(competitions);
      setIsLoading(false);
      // The WCA's list can sometimes be cached, so remove past compeitions
      const filteredCompetitions = competitions.filter((competition: any) => {
        const endDate = new Date(competition.end_date + "T12:00:00.000Z");
        return endDate > currentDate;
      });
      setFilteredComps(filteredCompetitions);
    };
    getCompetitionList();
  }, []); 

  // Event handler for distance dropdown
  const handleChange = (event: SelectChangeEvent) => {
    setDistance(parseInt(event.target.value, 10));
  };

  // Event handler for postal code input field
  const handleInputChange = (event: any) => {
    setPostalCode(event.target.value); 
  };

  // Handle if the user selects location automatically
  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        await reverseGeocode(position.coords.latitude, position.coords.longitude);
        setLocationInfo({
          name: postalCode,
          lat: Number(position.coords.latitude),
          lon: Number(position.coords.longitude),
        })
      }, (error) => {
        console.error("Error getting user's location:", error.message);
        // Handle the error gracefully if needed
      });
    } else {
      console.error("Geolocation is not supported in this browser.");
      // Handle the lack of geolocation support gracefully if needed
    }
  };

  // Find postal code to display if user selects locaiton automatically
  const reverseGeocode = async (latitude: number, longitude:number) => {
    const apiUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&addressdetails=1&format=jsonv2`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    setLocationInfo(data);
    setPostalCode(data.address.postcode);
  }

  // Find coordinates from postal code
  const geocode = async (postalCode: string) => {
    if(distance !== 0 && removeWhitespaceAndCase(locationInfo.name) !== removeWhitespaceAndCase(postalCode)) {
      const apiUrl = `https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&format=json`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      setLocationInfo(data[0]);
      return data[0];
    }
    return locationInfo
  };

  // Event handler for the search button, finds the user's coordinates based off their inputted postal code, then filters out competitions
  const handleButtonClick = async (event: any) => {
    const location = await geocode(postalCode);
    let displayedComps = [];
    for (const competition of competitionList) {
      if ((distance === 0 || findDistance(competition.latitude_degrees, competition.longitude_degrees, location.lat, location.lon) < Number(distance)) && new Date(competition.end_date + "T12:00:00.000Z") > currentDate) {
        displayedComps.push(competition);
      }
    }
    setFilteredComps(displayedComps);
  }
 
  const removeWhitespaceAndCase = (input: string) => {
    if (input === undefined) {
      return '';
    }
    return input.replace(/\s+/g, '').toLowerCase();
  }
  
  // Find the distance in km between two sets of coordinates using Haversine formula
  const findDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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
  
    const distance: number = earthRadius * c;
  
    return distance;
  }

  return (
    <Container maxWidth="xl" style={{ textAlign: "center" }}>
      <Box marginTop="4rem">
        <Typography component="h1" variant="h3" fontWeight="bold" gutterBottom>
          {t("competition.upcoming")}
        </Typography>
        <Typography gutterBottom  sx={{ maxWidth: "md", margin: "0 auto"}}>
          {t("competition.upcomingbody")}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            {t("competition.showonly1")}
            <FormControl sx={{ width: '15ch' }}>
              <InputLabel sx={{ textAlign: 'left' }} id="distance-selection">
                {t("competition.distance")}
                </InputLabel>
              <Select
                labelId="distance-selection"
                id="distance-selection"
                value={distance.toString()}
                label="Distnace"
                onChange={handleChange}
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
            <FormControl sx={{ width: '15ch' }}>
              <InputLabel htmlFor="postal-code-box">{t("competition.postalcode")}</InputLabel>
              <OutlinedInput
                id="postal-code"
                value={postalCode}
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
                label="Postal Code"
              />
            </FormControl>
            <Button onClick={handleButtonClick} variant="contained" size="large">
              <ArrowForward />
            </Button>
          </Box>
        </Typography>
      </Box> 
      { isLoading
        ? <Box margin="4rem">
            <CircularProgress />
          </Box> 
        : <Box display="flex" justifyContent="center" flexWrap="wrap">
          { filteredComps.slice().reverse().map((item: any, index: any) => (
            <Box margin="1rem" padding="1rem" key = {index}>
              <Typography variant="h5" fontWeight="bold">
                { item.name }
              </Typography>
              <Typography gutterBottom maxWidth="400px">
                {new Date(item.start_date + "T12:00:00.000Z").toLocaleString("en-US", {month: "long"})}
                { " | " }
                { item.city }
              </Typography> 
              <Button to={ `competitions/${item.id}` } component={Link} variant="contained" size="large">
                {t("competition.learnmore")}
              </Button>
            </Box>
          ))}
        </Box>
      }
    </Container>
  );
};

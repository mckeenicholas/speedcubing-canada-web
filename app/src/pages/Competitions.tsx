import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLocaleOrFallback } from "../locale";
import { useNavigate, useParams } from "react-router-dom";
import { LINKS } from "./links";
import { LoadingPageLinear } from "../components/LoadingPageLinear";
import { Box, Button, Container, Link, Typography } from "@mui/material";
import { CompetitionListElement, wcif } from "../types";

export const Competitions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [competitionList, setCompetitionList] = useState<
    CompetitionListElement[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getCompetitionList = async () => {
      const data = await fetch(LINKS.WCA.API.COMPETITION_LIST).then(
        async (response) => {
          return (await response.json()).items
            .reverse()
            .filter((competition: CompetitionListElement) => {
              const endDate = new Date(
                competition.date.till + "T23:59:59.999Z",
              );
              return endDate > new Date();
            });
        },
      );
      setCompetitionList(data);
      setIsLoading(false);
    };
    getCompetitionList();
  }, []);

  const checkSeries = async (compId: string) => {
    setIsLoading(true);
    const data: wcif = await fetch(
      LINKS.WCA.API.COMPETITION_INFO + compId + "/wcif/public",
    ).then((response) => {
      return response.json();
    });
    setIsLoading(false);
    if (data.series) {
      navigate(`./series/${data.series.id}`);
    } else {
      navigate(`./${compId}`);
    }
  };

  return (
    <Container maxWidth="xl" style={{ textAlign: "center" }}>
      {isLoading && <LoadingPageLinear />}
      <Box marginTop="4rem">
        <Typography component="h1" variant="h3" fontWeight="bold" gutterBottom>
          {t("competition.upcoming")}
        </Typography>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ maxWidth: "md", margin: "0 auto" }}
        >
          {t("competition.upcomingbody")}
        </Typography>
      </Box>
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
        alignItems="center"
      >
        {competitionList.map((competition) => (
          <Box margin="1rem" padding="1rem" key={competition.id}>
            <Typography variant="h5" fontWeight="bold">
              {competition.name}
            </Typography>
            <Typography gutterBottom maxWidth="400px">
              {new Date(
                competition.date.from + "T12:00:00.000Z",
              ).toLocaleString("en-US", { month: "long", day: "numeric" })}
              {" | "}
              {competition.city}
            </Typography>
            <Button
              onClick={() => checkSeries(competition.id)}
              component={Link}
              variant="contained"
              size="large"
            >
              {t("competition.learnmore")}
            </Button>
          </Box>
        ))}
      </Box>
    </Container>
  );
};

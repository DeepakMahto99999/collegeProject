import { apiClient } from "./api-client";

export const getAchievementsPreviewApi = () =>
  apiClient.get("/achievements/preview");

export const getAllAchievementsApi = () =>
  apiClient.get("/achievements");
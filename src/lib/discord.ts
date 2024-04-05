import axios from "axios";

export const httpClient = axios.create({
    baseURL: "https://discord.com/api/v10/"
});

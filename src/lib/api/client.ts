import { Client } from "@langchain/langgraph-sdk/client";

export const apiClient = new Client({ apiUrl: "http://localhost:2024" });

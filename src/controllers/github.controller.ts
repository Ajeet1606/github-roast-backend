import axios from "axios";
import { Request, Response } from "express";
import { ProfileSchema } from "../schema/profileSchema";
import {
  GoogleGenerativeAI,
  GoogleGenerativeAIResponseError,
} from "@google/generative-ai";

export async function roastUser(request: Request, response: Response) {
  const userName = request.params.username;
  const userDetails: ProfileSchema | null = await getProfileDetails(userName);
  // response.status(200).send(profileDetails);

  if (!userDetails) {
    return returnStreamedError("Github Profile not found.", response);
  }

  const prompt = `Here's a GitHub profile for you to roast:
    - Name: ${userDetails.name}
    - Bio: ${userDetails.bio}
    - Avatar URL: ${userDetails.avatarUrl}
    - Repositories: ${userDetails.repositories.totalCount}
    - Followers: ${userDetails.followers.totalCount}
    - Following: ${userDetails.following.totalCount}
    - Starred Repositories: ${userDetails.starredRepositories.totalCount}
    - Total Commits: ${userDetails.contributionsCollection.totalCommitContributions} in this year.

    Go ahead and give a satire roast of this GitHub user! Keep it in around 70 words. If they've done really great, appreaciate them as well.`;
  return await getRoastResponse(prompt, response);
}

async function getRoastResponse(prompt: string, response: Response) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
    const GEMINI_MODEL = process.env.GEMINI_MODEL!;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: "Act as a satire and sarcastic person.",
    });

    response.setHeader("Content-Type", "text/event-stream");
    let attempt = 0;
    const maxRetries = 3;
    let result;

    while (attempt < maxRetries) {
      try {
        result = await model.generateContentStream(prompt);
        break; // Exit the loop if the request is successful
      } catch (error) {
        if (
          error instanceof GoogleGenerativeAIResponseError &&
          error.message.includes("SAFETY")
        ) {
          console.warn(
            `Attempt ${attempt + 1} failed due to safety concerns. Retrying...`
          );
          // Optionally modify the prompt to make it less likely to be flagged
          prompt = modifyPrompt(prompt, attempt);
          attempt++;
        } else {
          return returnStreamedError(
            "Unexpected error, Please try again.",
            response
          ); // Re-throw non-safety-related errors
        }
      }
    }

    if (!result) {
      return returnStreamedError(
        "Failed to generate a safe response after multiple attempts, please try again.",
        response
      );
    }

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      response.write(`data: ${chunkText}\n\n`);
    }
    // Optional: Send a final message to indicate end of stream
    response.write("data: [END]\n\n");
    response.end(); // Close the response stream
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    response.status(500).send("Error calling Gemini API: " + error);
    return returnStreamedError(
      "Error in calling Gemini API at the moment, Please try again.",
      response
    );
  }
}

async function getProfileDetails(userName: string) {
  const GITHUB_GRAPHQL_API = process.env.GITHUB_GRAPHQL_API;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setFullYear(fromDate.getFullYear() - 1);
  const fromDateString = fromDate.toISOString();
  const toDateString = toDate.toISOString();

  const query = `query userInfo($login: String!, $from: DateTime!, $to: DateTime!, $before: String!) {
    user(login: $login) {
      name
      bio
      avatarUrl
      repositories(privacy: PUBLIC) {
        totalCount
      }
      followers(before: $before){
        totalCount
      }
      following(before: $before){
        totalCount
      }
      starredRepositories(before: $before){
        totalCount
      }
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
      }
    }
  }`;
  const variables = {
    login: userName,
    from: fromDateString,
    to: toDateString,
    before: toDateString,
  };

  try {
    const response = await axios.post(
      GITHUB_GRAPHQL_API!,
      { query, variables },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
      }
    );

    return response?.data?.data?.user;
  } catch (error) {
    console.log(error);
    return null;
  }
}

function modifyPrompt(prompt: string, attempt: number): string {
  // Modify the prompt based on the number of attempts
  // This is a simple example; you can customize this function as needed
  const suffixes = [
    " Please ensure it's safe for all audiences.",
    " Try to be less provocative.",
    " Make it a bit softer in tone.",
  ];

  return `${prompt}${suffixes[attempt] || ""}`;
}

function returnStreamedError(message: string, response: Response) {
  if (!response.headersSent) {
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.write(`data: ${message}\n\n`);
    response.write("data: [END]\n\n");
    response.end();
  } else {
    console.error("Headers already sent, cannot send error response");
  }
}

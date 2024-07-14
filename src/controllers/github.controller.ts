import axios from "axios";
import { Request, Response } from "express";
import { ProfileSchema } from "../schema/profileSchema";

export async function roastUser(request: Request, response: Response) {
  const userName = request.params.username;
  const profileDetails:ProfileSchema = await getProfileDetails(userName);
  response.send(profileDetails);
}

export async function getProfileDetails(userName: string) {

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
    before: toDateString
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

    return response?.data?.data?.user
  } catch (error) {
    console.log(error);
    return null;
  }
}

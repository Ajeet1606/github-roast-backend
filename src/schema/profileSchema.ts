export interface ProfileSchema {
  name: string;
  bio: string;
  avatarUrl: string;
  public_repos: number;
  repositories: {
    totalCount: number;
  };
  followers: {
    totalCount: number;
  };
  following: {
    totalCount: number;
  };
  contributionsCollection: {
    totalCommitContributions: number;
  };
  starredRepositories: {
    totalCount: number;
  }
}

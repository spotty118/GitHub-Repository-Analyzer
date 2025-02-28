/**
 * GitHub API response interfaces
 */

export interface GitHubTreeItem {
  type: string;
  path: string;
}

export interface GitHubResponse {
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  default_branch: string;
  open_issues_count: number;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubTreeResponse {
  tree: GitHubTreeItem[];
}

export interface GitHubContentResponse {
  content: string;
  encoding: string;
}

export interface RepoStats {
  stars: number;
  forks: number;
  watchers: number;
  defaultBranch: string;
  openIssues: number;
  language: string;
  createdAt: string;
  updatedAt: string;
}

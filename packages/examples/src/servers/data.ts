export interface Server {
  id: string;
  name: string;
  status: string;
  deploy_count: number;
  size: number;
  framework: string;
  git_repo: string;
  last_commit_id: string;
  last_commit_message: string;
}

export function listServers(): Server[] {
  return servers;
}

const servers: Server[] = [
  {
    id: "1",
    name: "dancing-lizard",
    status: "up",
    deploy_count: 14,
    size: 19.5,
    framework: "Elixir/Phoenix",
    git_repo: "https://git.example.com/dancing-lizard.git",
    last_commit_id: "f3d41f7",
    last_commit_message: "If this works, I'm going disco    🕺",
  },
  {
    id: "2",
    name: "lively-frog",
    status: "up",
    deploy_count: 12,
    size: 24.0,
    framework: "Elixir/Phoenix",
    git_repo: "https://git.example.com/lively-frog.git",
    last_commit_id: "d2eba26",
    last_commit_message: "Does it scale? 🤔",
  },
  {
    id: "3",
    name: "curious-raven",
    status: "up",
    deploy_count: 21,
    size: 17.25,
    framework: "Ruby/Rails",
    git_repo: "https://git.example.com/curious-raven.git",
    last_commit_id: "a3708f1",
    last_commit_message: "Fixed a bug! 🐞",
  },
  {
    id: "4",
    name: "cryptic-owl",
    status: "down",
    deploy_count: 2,
    size: 5.0,
    framework: "Elixir/Phoenix",
    git_repo: "https://git.example.com/cryptic-owl.git",
    last_commit_id: "c497e91",
    last_commit_message: "First big launch! 🤞",
  },
];

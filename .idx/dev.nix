# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.npm
    pkgs.nodePackages.nodemon
    pkgs.nodePackages.typescript
    pkgs.nodePackages.ts-node
    pkgs.git
  ];

  # Sets environment variables in the workspace
  env = {
    NODE_ENV = "development";
  };
  
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "ms-vscode.vscode-typescript-next"
      "bradlc.vscode-tailwindcss"
      "esbenp.prettier-vscode"
      "ms-vscode.vscode-json"
    ];

    # Enable previews
    previews = {
      enable = true;
      previews = {
        web = {
          # Run the frontend development server
          command = ["npm" "run" "dev"];
          manager = "web";
          cwd = "noctua-forest";
          env = {
            # Environment variables to set for your server
            PORT = "$PORT";
          };
        };
        backend = {
          # Run the backend development server
          command = ["npm" "run" "dev"];
          manager = "web";
          cwd = "node-backend";
          env = {
            PORT = "3001";
          };
        };
      };
    };

    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        # Install dependencies for both frontend and backend
        install-frontend = "cd noctua-forest && npm install";
        install-backend = "cd node-backend && npm install";
      };
      # Runs when the workspace is (re)started
      onStart = {
        # Start both servers in development mode
        start-backend = "cd node-backend && npm run dev &";
        start-frontend = "cd noctua-forest && npm run dev";
      };
    };
  };
}

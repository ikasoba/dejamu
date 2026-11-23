{
  inputs = {
    nixpkgs.url = "nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        buildInputs = with pkgs; [
          pnpm
          nodejs-slim
        ];
        packages = buildInputs ++ (with pkgs; [
          typescript-language-server
        ]);
      in {
        devShells.default = pkgs.mkShell {
          inherit packages;
        };
      }
    );
}

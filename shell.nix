{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    esbuild
    gnumake
    sassc
    nodePackages.typescript
    nodePackages.web-ext
  ];
}

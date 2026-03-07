module.exports = {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/exec",
      {
        prepareCmd: "yarn workspace create-joist-app version ${nextRelease.version}",
        publishCmd: "yarn workspace create-joist-app npm publish",
      },
    ],
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "packages/create-joist-app/package.json"],
      },
    ],
  ],
};

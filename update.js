module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "git pull --ff-only"
      }
    },
    {
      method: "shell.run",
      params: {
        path: "app",
        message: [
          "git fetch --all --prune",
          "git checkout b722874",
          "npm ci"
        ]
      }
    }
  ]
}

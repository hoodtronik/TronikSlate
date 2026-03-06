module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "git fetch --all --prune && git checkout 140071daddedf1f7d278547ba050bfc9b3658c58"
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

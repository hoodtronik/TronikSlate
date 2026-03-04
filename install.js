module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: [
          "git clone --depth 1 https://github.com/heheok/bytecut-director.git app",
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        path: "app",
        message: [
          "npm ci",
        ]
      }
    },
  ]
}

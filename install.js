module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/heheok/bytecut-director.git app",
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        path: "app",
        message: [
          "git checkout b722874",
          "npm ci",
        ]
      }
    },
  ]
}

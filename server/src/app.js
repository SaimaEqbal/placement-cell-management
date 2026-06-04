const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Placement Cell API Running");
});

module.exports = app;
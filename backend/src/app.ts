// src/app.ts
import AppDataSource from './data-source';
import express from "express";
import * as dotenv from "dotenv";
dotenv.config();

import authRouter from "./auth/controllers/auth.controller";
import userRouter from "./user/controllers/user.controller";
import playerRouter from "./player/controllers/player.controller";
import tournamentRouter from "./tournament/controllers/tournament.controller";
// import "./cron/tournamentPairing.cron"; // This will register and start the cron job

const app = express();

app.use(express.json());

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/player", playerRouter);
app.use("/tournament", tournamentRouter);

app.get("/healthy", (req, res) => {
  res.json({ status: "ok", message: "Server is healthy!" });
});

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server is healthy!" });
});

// Start server
const PORT = process.env.PORT || 9000;
AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    })
  });
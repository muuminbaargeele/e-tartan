// src/app.ts
import AppDataSource from './data-source';
import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import pinoHttp from "pino-http";
import logger from "./utils/logger";
dotenv.config();

import authRouter from "./auth/controllers/auth.controller";
import userRouter from "./user/controllers/user.controller";
import playerRouter from "./player/controllers/player.controller";
import tournamentRouter from "./tournament/controllers/tournament.controller";
import matchRouter from "./match/controllers/match.controller";
import configRouter from "./config/controllers/config.controller";

import { ConfigService } from "./config/services/config.service";
import { MatchCronService } from "./cron/matchCron.service";
import { WhatsappService } from "./bot/services/whatsapp.service";
// import "./cron/tournamentPairing.cron"; // This will register and start the cron job

const app = express();

// HTTP Request Logging Middleware
app.use(
  pinoHttp({
    logger,
    customLogLevel: function (req, res, err) {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return "warn";
      } else if (res.statusCode >= 500 || err) {
        return "error";
      }
      return "info";
    },
    customSuccessMessage: function (req, res) {
      return `${req.method} ${req.url} completed`;
    },
    customErrorMessage: function (req, res, err) {
      return `${req.method} ${req.url} errored: ${err.message}`;
    },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        headers: {
          host: req.headers.host,
          "user-agent": req.headers["user-agent"],
          "content-type": req.headers["content-type"],
        },
        remoteAddress: req.remoteAddress,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  })
);

app.use(cors({
  origin: "*", // allow from any origin during dev, or specify http://localhost:5173
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/player", playerRouter);
app.use("/tournament", tournamentRouter);
app.use("/match", matchRouter);
app.use("/config", configRouter);

app.get("/healthy", (req, res) => {
  res.json({ status: "ok", message: "Server is healthy!" });
});

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server is healthy!" });
});

// Start server
const PORT = process.env.PORT || 9000;
AppDataSource.initialize()
  .then(async () => {
    // Initialize Config
    const configService = new ConfigService();
    await configService.initializeDefaults();
    logger.info("Config initialized");

    // Initialize Cron
    const cronService = new MatchCronService();
    cronService.init();
    logger.info("Cron initialized");

    // Initialize WhatsApp Bot
    // Check config if enabled? Default true for now or load from config
    const whatsappEnabled = (await configService.get("bot_config"))?.whatsappEnabled ?? true;
    if (whatsappEnabled) {
      new WhatsappService();
      logger.info("WhatsApp Bot starting...");
    }

    app.listen(PORT, () => {
      logger.info({ port: PORT }, `🚀 Server running on port ${PORT}`);
    })
  })
  .catch((err) => {
    logger.error({ err }, "Error during Data Source initialization");
  });
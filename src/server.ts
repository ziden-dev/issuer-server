// import logger from 'morgan';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import mongoose from 'mongoose';

import { MONGODB_URI, LOG_OUTPUT } from "./common/config/secrets.js";
import dotenv from 'dotenv';
import { GlobalVariables } from "./common/config/global.js";
import * as swaggerUi from "swagger-ui-express";
import { readFileSync } from 'fs';
import logger from './lib/logger/index.js';
import morgan from 'morgan';
import { AthenRoutes } from './routers/authenRoutes.js';
import { IssuerRooutes } from './routers/issuersRoutes.js';
import { ClaimsRouters } from './routers/claimsRoutes.js';
import { SchemasRouter } from './routers/schemasRoutes.js';
import { RegistriesRoutes } from './routers/registriesRoutes.js';
import { NetWorkRoutes } from './routers/networksRoutes.js';

const swaggerDocument = JSON.parse(readFileSync("swagger/swagger.json", "utf-8"));

dotenv.config();

class Server {
  public app: express.Application;
  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.mongo();
    this.configSwagger();
    // setupGlobalVariables();

  }

  public routes(): void {
    this.app.use("/api/auth", new AthenRoutes().router);
    this.app.use("/api/issuers", new IssuerRooutes().router);
    this.app.use("/api/claims", new ClaimsRouters().router);
    this.app.use("/api/schemas", new SchemasRouter().router);
    this.app.use("/api/registries", new RegistriesRoutes().router);
    this.app.use("/api/networks", new NetWorkRoutes().router);
  }

  public config(): void {
    this.app.set("port", process.env.PORT || 3000);
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 1000000 }));
    this.app.use(compression());
    this.app.use(cors());

    const myStream = {
      write: (text: any) => {
        logger.info(text);
      }
    }
    this.app.use(morgan(LOG_OUTPUT, { stream: myStream }));
    // this.app.use(logger('[:date[web]] | :method :url | :status | :response-time ms'));

  }

  private mongo(): void {
    const connection = mongoose.connection;
    connection.on("connected", () => {
      logger.info("Mongo Connection Established");
    });
    connection.on("reconnected", () => {
      logger.info("Mongo Connection Reestablished");
    });
    connection.on("disconnected", () => {
      logger.info("Mongo Connection Disconnected");
      logger.info("Trying to reconnect to Mongo ...");
      setTimeout(() => {
        mongoose.connect(MONGODB_URI, {
          keepAlive: true
        });
      }, 3000);
    });
    connection.on("close", () => {
      logger.info("Mongo Connection Closed");
    });
    connection.on("error", (error: Error) => {
      logger.info("Mongo Connection ERROR: " + error);
    });

    const run = async () => {
      await mongoose.connect(MONGODB_URI, {
        keepAlive: true
      });
    };
    run().catch(error => console.error(error));
  }

  private configSwagger(): void {
    this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  public start(): void {
    this.app.listen(this.app.get("port"), () => {
      logger.info(
        "API is running at http://localhost:" +
        this.app.get("port")
      );
    });
  }

}

async function startServer(): Promise<void> {
  await GlobalVariables.init();
  const server = new Server();
  server.start();
}

startServer();
import dotenv from 'dotenv';
import process from 'process';
dotenv.config();

export const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/ISSUER_SERVER";
export const STATE_ADDRESS = process.env.STATE_ADDRESS ?? "0x0"
export const RPC_PROVIDER = process.env.RPC_PROVIDER ?? "https://data-seed-prebsc-1-s1.binance.org:8545/"
export const isProduction = process.env.NODE_ENV == "production";
export const LOG_LEVEL = process.env.LOG_LEVEL ?? "debug";
export const LOG_OUTPUT = process.env.LOG_OUTPUT ?? "dev";
export const ZIDEN_SERVER_URI = process.env.ZIDEN_SERVER_URI ?? "http://localhost:5000";

export const ISSUER_PRIVATE_KEY = process.env.ISSUER_PRIVATE_KEY?.split(", ") ?? ["123456789", "987654321"];
export const ISSUER_SERVER_URL = process.env.ISSUER_SERVER_URL ?? "http://localhost:3000";
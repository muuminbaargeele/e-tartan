import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT as string, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/**/entities/*.entity.{ts,js}'], // <-- updated line
  migrationsTableName: 'migrations',
  migrations: [__dirname + '/migrations/*.{ts,js}'], // <-- updated line
});
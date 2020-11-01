import { config } from "../../config";
import thinky from "./thinky";

const { r } = thinky;

let warehouseConfig;

if (config.WAREHOUSE_DB_TYPE) {
  warehouseConfig = {
    client: config.WAREHOUSE_DB_TYPE,
    connection: {
      host: config.WAREHOUSE_DB_HOST,
      port: config.WAREHOUSE_DB_PORT,
      database: config.WAREHOUSE_DB_NAME,
      password: config.WAREHOUSE_DB_PASSWORD,
      user: config.WAREHOUSE_DB_USER
    }
  };
}

export default (config.WAREHOUSE_DB_TYPE ? () => r(warehouseConfig) : null);

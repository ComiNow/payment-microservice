import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
   PORT: number;
   NATS_SERVICE_NAME: string;
   NATS_SERVERS: string;
   APP_SERVICE_CLIENT_BASE_URL: string;
   DATABASE_URL: string;
   ENCRYPTION_KEY: string;
   APP_SECRET: string;
}

const envVarsSchema = joi.object({
   PORT: joi.number().required(),
   NATS_SERVICE_NAME: joi.string().required(),
   NATS_SERVERS: joi.array().items(joi.string()).required(),
   APP_SERVICE_CLIENT_BASE_URL: joi.string().uri().required(),
   DATABASE_URL: joi.string().uri().required(),
   ENCRYPTION_KEY: joi.string().optional(),
   APP_SECRET: joi.string().optional(),
}).unknown(true);


const { error, value } = envVarsSchema.validate({
   ...process.env,
   NATS_SERVERS: process.env.NATS_SERVERS?.split(',')
});

if (error) {
   throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
   port: envVars.PORT,
   natsServiceName: envVars.NATS_SERVICE_NAME,
   natsServers: envVars.NATS_SERVERS,
   appServiceClientBaseUrl: envVars.APP_SERVICE_CLIENT_BASE_URL,
   databaseUrl: envVars.DATABASE_URL,
   encryptionKey: envVars.ENCRYPTION_KEY,
   appSecret: envVars.APP_SECRET,
}
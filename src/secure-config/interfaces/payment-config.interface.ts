export interface PaymentCredentials {
  accessToken: string;
  webhookSecret: string;
}

export interface EncryptedConfigData {
  encryptedData: string;
  iv: string;
  tag: string;
}
import { Injectable } from '@nestjs/common';
import { randomBytes, createHash, createCipheriv, createDecipheriv } from 'crypto';
import { envs } from 'src/config/envs';

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  tag: string;
}

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: string;

  constructor() {
    const encryptionKey = envs.encryptionKey;
    const appSecret = envs.appSecret
    this.secretKey = this.generateKey(encryptionKey || appSecret);
  }

  private generateKey(secret: string): string {
    return createHash('sha256')
      .update(secret)
      .digest('hex');
  }

  encrypt(data: any): EncryptionResult {
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv(this.algorithm, Buffer.from(this.secretKey, 'hex'), iv);
      
      const jsonString = JSON.stringify(data);
      let encrypted = cipher.update(jsonString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      throw new Error(`Error encrypting data: ${error.message}`);
    }
  }

  decrypt(encryptedData: string, iv: string, tag: string): any {
    try {
      const decipher = createDecipheriv(this.algorithm, Buffer.from(this.secretKey, 'hex'), Buffer.from(iv, 'hex'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(`Error decrypting data: ${error.message}`);
    }
  }
}
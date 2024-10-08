import { Encryption } from '@super-protocol/dto-js';
import Crypto from '../../crypto/index.js';

export class OrderArgsHelper {
  static async decryptOrderArgs<T>(
    encryptedArgs: string,
    ecdhPrivateKey: string,
  ): Promise<T | undefined> {
    if (!encryptedArgs) {
      return;
    }

    const encrypted: Encryption = JSON.parse(encryptedArgs);
    encrypted.key = ecdhPrivateKey;

    const decryptedArgsStr = await Crypto.decrypt(encrypted);
    const orderArguments = JSON.parse(decryptedArgsStr);

    return orderArguments as T;
  }

  static async encryptOrderArgs(args: unknown, encryption: Encryption): Promise<string> {
    const encryptedArgs = await Crypto.encrypt(JSON.stringify(args), encryption);

    return JSON.stringify(encryptedArgs);
  }
}

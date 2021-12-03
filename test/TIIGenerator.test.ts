import { OrderInfo, TeeOfferInfo } from '../src';
import TIIGenerator from '../src/TIIGenerator';

const argsPublicKeyAlgo = 'ECIES';
const argsPrivateKey = "e96e82fa66724817ec14a8e2bb7b8e5ec165070775bd70cbf102470dd1a5cf9b";
const argsPublicKey =
    "04795681c5a781c1b118ca32ff1beb8b9a98d1a79d744b7924c9d0a6c3594126db7753827cf2ce9cb0dad09e678687c0fbfefc0db05d069a3683a5de0cf4066560";

const tii = JSON.stringify({
    "url":"{\"iv\":\"tNiH58S8m1BbM+C4GMPrhQ==\",\"ephemPublicKey\":\"BJK8eU5zN6xFfAjACwDbrVR6HqsDS1i+gJ59FIaA8fGi3OpMpIEyLCTUJqvkLCaEowuZNdU4/NFX1WZJvnzzFbc=\",\"ciphertext\":\"fXZThnssqLWG19gNhvcDrg==\",\"mac\":\"nU27vLAymmzv/gEc83G7drz6AJEeycHFLX66z3UqMng=\"}",
    "tri":"{\"v\":\"hybrid-crypto-js_0.2.4\",\"iv\":\"NDVlylaXKYz5K5oGTKTVqjISl6HGJMGNXWMIgwxq/sM=\",\"keys\":{\"86:e7:6f:c5:d0:d9:9f:85:c9:a5:20:18:5e:28:0b:3d:a0:fc:7e:fa\":\"EUlcGYIvAz47cbAn6WTIzHHHUFTE9dMpOcgcqevOSLaaDEcLTJMqOPgEjyb34ILhvXrvBmewH17YX/fvY1n4fGUsMfDlRKgtCuKNEHI+8UG+meu4y1/7Qghs9oI38mDc8TF3b6lTWR2rXCTzEF+ai9K6CXFkGk3dbN4iaNhumIM=\"},\"cipher\":\"NEwfNj5DLU080Rw63OLTVpE030tbwOKyqLKpKlXc4VThzhGzqKacvYdyk6xV/FjoVUAY52R4JAh15cut+sl0DDe/BYzq93fBkkdb3Wnp16z33PLgeFdVgUAET5AHCCLe\",\"tag\":\"lzNG6FYA2ybQYnZKAcM/yg==\"}"
});


jest.mock('../src/models/Order', () => {
  return jest.fn().mockImplementation(() => {
    return {
        async getParentOrder() {
            return '';
        },
        async getOrderInfo() {
            return {
                offer: '',
            } as OrderInfo;
        },
    };
  });
});

jest.mock('../src/models/TeeOffer', () => {
  return jest.fn().mockImplementation(() => {
    return {
        async getInfo() {
            return {
                argsPublicKey,
                argsPublicKeyAlgo,
            } as TeeOfferInfo;
        },
    };
  });
});

describe("TIIGenerator", () => {
    test("generate TII", async () => {
        const tii = await TIIGenerator.generate('', '/url', [], {}, 'encriptionKey', argsPublicKeyAlgo);

        expect(typeof tii).toBe('string');

        console.log(tii);

        const tiiObj = JSON.parse(tii);

        expect(tiiObj).toHaveProperty('url');
        expect(tiiObj).toHaveProperty('tri');
    });

    test("get TRI", async () => {
        const tri = await TIIGenerator.getTRI(tii,argsPrivateKey, argsPublicKeyAlgo);

        expect(tri).toHaveProperty('solutionHashes');
        expect(tri).toHaveProperty('args');
        expect(tri).toHaveProperty('encryptionKey');
        expect(tri).toHaveProperty('encryptionKeyAlgo');
        expect(tri.encryptionKeyAlgo).toBe(argsPublicKeyAlgo);
    });

    test("get url", async () => {
        const url = await TIIGenerator.getUrl(tii,argsPrivateKey, argsPublicKeyAlgo);

        expect(url).toBe('/url');
    });
});
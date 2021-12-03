import { OrderInfo, TeeOfferInfo } from '../src';
import TIIGenerator from '../src/TIIGenerator';

const argsPublicKeyAlgo = 'ECIES';
const argsPrivateKey = "e96e82fa66724817ec14a8e2bb7b8e5ec165070775bd70cbf102470dd1a5cf9b";
const argsPublicKey =
    "04795681c5a781c1b118ca32ff1beb8b9a98d1a79d744b7924c9d0a6c3594126db7753827cf2ce9cb0dad09e678687c0fbfefc0db05d069a3683a5de0cf4066560";

const tii = JSON.stringify({
    "url":"{\"iv\":\"tNiH58S8m1BbM+C4GMPrhQ==\",\"ephemPublicKey\":\"BJK8eU5zN6xFfAjACwDbrVR6HqsDS1i+gJ59FIaA8fGi3OpMpIEyLCTUJqvkLCaEowuZNdU4/NFX1WZJvnzzFbc=\",\"ciphertext\":\"fXZThnssqLWG19gNhvcDrg==\",\"mac\":\"nU27vLAymmzv/gEc83G7drz6AJEeycHFLX66z3UqMng=\"}",
    "tri":"{\"iv\":\"xXPS60JRRY8ZMIaTA+gBTA==\",\"ephemPublicKey\":\"BFLisfCUXvHTUyY2pOmO9t/ZXJoTouTkxp/rauB0Y5H9ZmNbwp1tLzZKp3lqiwu500U53MQLpsjujFynb/q5E+k=\",\"ciphertext\":\"D0edcGUkw3rJZE3JUQjSQZcWz/UwLwU+/XsD/CoqCauXjsH9B6wB1hHVJ5GZuUVOL7xTxpOHPOD3GLHRnltnSVyLzU+/auNOon9eKXxTKDD+m8/MRojg80KZ288Y+1Tm\",\"mac\":\"GREKOybYpxOxuKbFnL3EhXwSLj0mDESrrWEXedOR630=\"}"
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

        const tiiObj = JSON.parse(tii);

        expect(tiiObj).toHaveProperty('url');
        expect(tiiObj).toHaveProperty('tri');
    });

    test("get url", async () => {
        const url = await TIIGenerator.getUrl(tii,argsPrivateKey, argsPublicKeyAlgo);

        expect(url).toBe('/url');
    });
});
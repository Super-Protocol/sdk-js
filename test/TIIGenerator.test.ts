import { OrderInfo, TeeOfferInfo } from '../src';
import TIIGenerator from '../src/TIIGenerator';

const argsPublicKeyAlgo = 'ECIES';
const argsPrivateKey = 'e96e82fa66724817ec14a8e2bb7b8e5ec165070775bd70cbf102470dd1a5cf9b';
const argsPrivateKeyIncorrect = '290ff4d20071c88a60c81ef709bc5a762ed366224a229ca4ac230e53f1524644';
const argsPublicKey =
    '04795681c5a781c1b118ca32ff1beb8b9a98d1a79d744b7924c9d0a6c3594126db7753827cf2ce9cb0dad09e678687c0fbfefc0db05d069a3683a5de0cf4066560';

const tii = JSON.stringify({
    "url":"{\"iv\":\"tNiH58S8m1BbM+C4GMPrhQ==\",\"ephemPublicKey\":\"BJK8eU5zN6xFfAjACwDbrVR6HqsDS1i+gJ59FIaA8fGi3OpMpIEyLCTUJqvkLCaEowuZNdU4/NFX1WZJvnzzFbc=\",\"ciphertext\":\"fXZThnssqLWG19gNhvcDrg==\",\"mac\":\"nU27vLAymmzv/gEc83G7drz6AJEeycHFLX66z3UqMng=\"}",
    "tri":"{\"iv\":\"RvRXsQseggWi2oe8g0JvQw==\",\"ephemPublicKey\":\"BJeMzAOrdi1lEup9NiCK/OM5ue4Wu6WRW2hJgxeQb+75VeHrIgl6PzaVTuaZOn/MCqv0PdtN7HOnY86uTLcb15Q=\",\"ciphertext\":\"T1I9BrhQ2UrcFFxs5vcxjvCiV3c9fTWwkjD4lTuQqV1MY900vAaFSRxqESlZS86JbxKQjCKTeGks0DNmV6vk+40rIPE+gbaUl4vC6q4+9YJI8Ovw0CrZ6oHv/4BgJohm\",\"mac\":\"aavEEKxtPG4nXPzoAGV76P9b1NsprIUiJljMFX24IQE=\"}"
});


jest.mock('../src/models/Order', () => {
  return jest.fn().mockImplementation((address) => {
    if (address !== 'order' && address !== 'parentOrder' && address !== 'teeOrder') {
        throw new Error('Order doesnot exists');
    }
    return {
        async getParentOrder() {
            return address === 'teeOrder' ? null : 'parentOrder';
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

describe('TIIGenerator', () => {
    describe('generate', () => {
        test('generate TII', async () => {
            const tii = await TIIGenerator.generate('order', '/url', [], {}, 'encriptionKey', argsPublicKeyAlgo);
    
            expect(typeof tii).toBe('string');
    
            const tiiObj = JSON.parse(tii);
    
            expect(tiiObj).toHaveProperty('url');
            expect(tiiObj).toHaveProperty('tri');
        });

        test('fail for no Order', async () => {
            expect(
                TIIGenerator.generate('badOrder', '/url', [], {}, 'encriptionKey', argsPublicKeyAlgo)
            ).rejects.toThrowError();
        });

        test('fail for no parent Order', async () => {
            expect(
                TIIGenerator.generate('teeOrder', '/url', [], {}, 'encriptionKey', argsPublicKeyAlgo)
            ).rejects.toThrowError();
        });
    });

    describe('getTRI', () => {
        test('get TRI', async () => {
            const tri = await TIIGenerator.getTRI(tii,argsPrivateKey, argsPublicKeyAlgo);
    
            expect(tri).toHaveProperty('solutionHashes');
            expect(tri).toHaveProperty('args');
            expect(tri).toHaveProperty('encryptionKey');
            expect(tri).toHaveProperty('encryptionKeyAlgo');
            expect(tri.encryptionKeyAlgo).toBe(argsPublicKeyAlgo);
        });

        test('incorrect encription key', async () => {
            expect(TIIGenerator.getTRI(tii, argsPrivateKeyIncorrect, argsPublicKeyAlgo)).rejects.toThrowError();
        });
    });

    describe('getUrl', () => {
        test('get url', async () => {
            const url = await TIIGenerator.getUrl(tii,argsPrivateKey, argsPublicKeyAlgo);

            expect(url).toBe('/url');
        });

        test('incorrect encription key', async () => {
            expect(TIIGenerator.getUrl(tii, argsPrivateKeyIncorrect, argsPublicKeyAlgo)).rejects.toThrowError();;
        });
    });
});

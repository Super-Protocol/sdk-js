import { Orders, OrderUsage, PriceType } from '../../src';

describe('Orders static model', () => {
  describe('selected usage calculation', () => {
    const selectedUsage = {
      slotCount: 4,
      slotInfo: {
        cpuCores: 1,
        ram: 9850475854,
        diskUsage: 14910627722,
      },
      slotUsage: {
        priceType: PriceType.PerHour,
        price: '140000000000000000',
        minTimeMinutes: 10,
        maxTimeMinutes: 0,
      },
    } as OrderUsage;

    test('calculates accumulated slot info', () => {
      const accumulatedSlotInfo = Orders.accumulatedSlotInfo(selectedUsage);

      expect(accumulatedSlotInfo).toEqual({
        cpuCores: 4,
        ram: 39401903416,
        diskUsage: 59642510888,
      });
    });

    test('calculated slot price', () => {
      const accumulatedSlotUsage = Orders.accumulatedSlotUsage(selectedUsage);

      expect(accumulatedSlotUsage).toEqual({
        priceType: PriceType.PerHour,
        price: '560000000000000000',
        minTimeMinutes: 10,
        maxTimeMinutes: 0,
      });
    });
  });
});

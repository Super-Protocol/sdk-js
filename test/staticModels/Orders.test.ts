import { Orders, OrderUsage, PriceType } from '../../src';

describe('Orders static model', () => {
  describe('selected usage calculation', () => {
    const selectedUsage = {
      slotCount: 4,
      optionInfo: [
        {
          bandwidth: 125000,
          traffic: 100000000,
          externalPort: 0,
        },
        {
          bandwidth: 0,
          traffic: 10000000,
          externalPort: 0,
        },
        {
          bandwidth: 0,
          traffic: 0,
          externalPort: 1,
        },
      ],
      optionUsage: [
        {
          priceType: PriceType.PerHour,
          price: '140000000000000000',
          minTimeMinutes: 0,
          maxTimeMinutes: 0,
        },
        {
          priceType: PriceType.Fixed,
          price: '100000000000000000',
          minTimeMinutes: 0,
          maxTimeMinutes: 0,
        },
      ],
      optionIds: ['1', '2', '3'],
      optionsCount: [10, 120, 1],
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

    test('calculates accumulated options info', () => {
      const accumulatedOptionsInfo = Orders.accumulatedOptionsInfo(selectedUsage);

      expect(accumulatedOptionsInfo).toEqual({
        bandwidth: 1250000,
        traffic: 2200000000,
        externalPort: 1,
      });
    });

    test('returns object with zeros if options are not chosen', () => {
      const selectedUsageWithoutOptions = {
        ...selectedUsage,
        optionIds: [],
        optionInfo: [],
        optionsCount: [],
        optionUsage: [],
      };

      const accumulatedOptionsInfo = Orders.accumulatedOptionsInfo(selectedUsageWithoutOptions);

      expect(accumulatedOptionsInfo).toEqual({
        bandwidth: 0,
        traffic: 0,
        externalPort: 0,
      });
    });

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

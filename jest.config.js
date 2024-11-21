module.exports = {
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json'
      },
    ],
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
};

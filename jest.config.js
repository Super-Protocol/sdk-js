module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals:{
    'ts-jest': {
        tsconfig: 'tsconfig.build.json'
      }
  },
  moduleNameMapper: {
    axios: 'axios/dist/node/axios.cjs'
  }
};

require('ts-node').register({
  compilerOptions: {
    outDir: '../test-js',
    allowJs: true,
    module: 'commonjs',
    esModuleInterop: true,
  },
});

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiNock = require('chai-nock');

chai.use(chaiAsPromised);
chai.use(chaiNock);

process.env.NODE_ENV = 'test';

global.expect = chai.expect;

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(test|spec).[tj]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json']
};

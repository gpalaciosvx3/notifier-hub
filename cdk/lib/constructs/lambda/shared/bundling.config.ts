import * as path from 'path';
import { BundlingOptions } from 'aws-cdk-lib/aws-lambda-nodejs';

export const lambdaBundling: BundlingOptions = {
  preCompilation: false,
  externalModules: [],
  minify: true,
  sourceMap: false,
  target: 'node20',
  tsconfig: path.join(__dirname, '../../../../../tsconfig.json'),
};

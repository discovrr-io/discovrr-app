/* eslint no-unused-expressions: 0 no-console: 0 */

const debugAppLogger = (logData, ...params) => {
  const { ...rest } = typeof logData === 'string'
    ? { logData, ...params }
    : logData;

  const tempError = new Error();
  const tempCaller = tempError.stack.toString().split(/\r\n|\n/)[2].trim().split(' ');
  const caller = tempCaller[1];

  // const tempCallingLine = tempCaller[tempCaller.length - 1];
  // const lineNumber = tempCallingLine.substring(tempCallingLine.lastIndexOf(':') + 1, tempCallingLine.lastIndexOf(')'));

  console.debug(`\n\n->\t${caller}`);

  // (Array.isArray(rest) ? console.info(rest.join()) : console.info(rest));
  (Array.isArray(rest)
    ? console.info(JSON.stringify(rest.join(), null, 2))
    : console.info(JSON.stringify(rest, null, 2)));

  console.info('\n\n');
};

export default debugAppLogger;

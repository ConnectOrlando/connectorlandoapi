export class GithubActionsReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    for (const testResultItem of results.testResults) {
      const { testFilePath } = testResultItem;

      for (const result of testResultItem.testResults) {
        if (result.status !== 'failed') {
          continue;
        }

        for (const failureMessages of result.failureMessages) {
          const newLine = '%0A';
          const message = failureMessages.replace(/\n/g, newLine);
          const captureGroup = message.match(/:(\d+):(\d+)/);

          if (!captureGroup) {
            console.log('Unable to extract line number from call stack');
            continue;
          }

          const [, line, col] = captureGroup;
          console.log(
            `::error file=${testFilePath},line=${line},col=${col}::${message}`
          );
        }
      }
    }
  }
}

export default GithubActionsReporter;

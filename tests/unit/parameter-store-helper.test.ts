import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ParameterStoreHelper } from '../../lib/parameter-store-helper';

describe('ParameterStoreHelper', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let helper: ParameterStoreHelper;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    helper = new ParameterStoreHelper(stack, {
      environment: 'test',
      stackName: 'test-stack'
    });
  });

  test('creates output with parameter store parameter', () => {
    helper.createOutputWithParameter(
      'TestOutput',
      'test-value',
      'Test description',
      'test-export-name'
    );

    const template = Template.fromStack(stack);

    // Check CloudFormation output
    template.hasOutput('TestOutput', {
      Value: 'test-value',
      Description: 'Test description',
      Export: {
        Name: 'test-export-name'
      }
    });

    // Check Parameter Store parameter
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/acorn-pups/test/cfn-outputs/test-stack/test-output',
      Value: 'test-value',
      Description: '[test-stack] Test description',
      Type: 'String'
    });
  });

  test('creates parameter with custom path', () => {
    helper.createOutputWithParameter(
      'CustomPathOutput',
      'custom-value',
      'Custom description',
      undefined,
      '/custom/path/to/parameter'
    );

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/custom/path/to/parameter',
      Value: 'custom-value',
      Description: '[test-stack] Custom description',
      Type: 'String'
    });
  });

  test('converts PascalCase to kebab-case for parameter paths', () => {
    helper.createOutputWithParameter(
      'SomeVeryLongOutputName',
      'value',
      'Description'
    );

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/acorn-pups/test/cfn-outputs/test-stack/some-very-long-output-name',
      Value: 'value'
    });
  });

  test('creates multiple outputs with parameters', () => {
    helper.createMultipleOutputsWithParameters([
      {
        outputId: 'Output1',
        value: 'value1',
        description: 'Description 1',
        exportName: 'export1'
      },
      {
        outputId: 'Output2',
        value: 'value2',
        description: 'Description 2',
        parameterPath: '/custom/path2'
      }
    ]);

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SSM::Parameter', 2);

    template.hasOutput('Output1', {
      Value: 'value1',
      Export: { Name: 'export1' }
    });

    template.hasOutput('Output2', {
      Value: 'value2',
      Description: 'Description 2'
    });

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/custom/path2',
      Value: 'value2'
    });
  });

  test('gets correct parameter path', () => {
    const path = helper.getParameterPath('TestOutputName');
    expect(path).toBe('/acorn-pups/test/cfn-outputs/test-stack/test-output-name');
  });

  test('creates standalone parameter', () => {
    helper.createParameter(
      'StandaloneParam',
      'param-value',
      'Standalone parameter description'
    );

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/acorn-pups/test/cfn-outputs/test-stack/standalone-param',
      Value: 'param-value',
      Description: '[test-stack] Standalone parameter description'
    });
  });
}); 
import { ValidationResult } from './validationResult-interface';


export interface PassiveTool {
  validate(
    step: any,
    geoElement: any,
    labelSensitive: boolean
  ): ValidationResult;
}

export function isPassiveTool(tool: any): tool is PassiveTool {
  return tool && typeof tool.validate === 'function';
}
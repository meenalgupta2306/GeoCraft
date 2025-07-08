import { GeoRef } from './geoRef';
import { ValidationResult } from './validationResult-interface';

export interface InteractiveTool {
  handlePointerDown(view: GeoRef, x: number, y: number): void;
  handlePointerUp(view: GeoRef, x: number, y: number): void;
  validate(
    step: any,
    geoElement: any,
    labelSensitive: boolean
  ): ValidationResult;
}


export function isInteractiveTool(tool: any): tool is InteractiveTool {
  return (
    tool &&
    typeof tool.handlePointerDown === 'function' &&
    typeof tool.handlePointerUp === 'function'
  );
}



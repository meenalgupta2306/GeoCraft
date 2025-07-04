import { GeoCraftViewComponent } from '../../view/geo-craft-view/geo-craft-view.component';
import { ValidationResult } from './validationResult-interface';

export interface InteractiveTool {
  handlePointerDown(view: GeoCraftViewComponent, x: number, y: number): void;
  handlePointerUp(view: GeoCraftViewComponent, x: number, y: number): void;
  validate(
    step: any,
    geoElement: any,
    labelSensitive: boolean
  ): ValidationResult;
}

export interface PassiveTool {
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

export function isPassiveTool(tool: any): tool is PassiveTool {
  return tool && typeof tool.validate === 'function';
}

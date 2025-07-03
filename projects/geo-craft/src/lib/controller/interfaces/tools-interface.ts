import { GeoCraftViewComponent } from "../../view/geo-craft-view/geo-craft-view.component";
import { ValidationResult } from "./validationResult-interface";
export interface Tool {

  validate(step: any,geoElement: any, labelSensitive: boolean): ValidationResult;
  handlePointerDown(view: GeoCraftViewComponent, x: number, y: number): void;
  handlePointerUp(view: GeoCraftViewComponent, x: number, y: number): void;
}

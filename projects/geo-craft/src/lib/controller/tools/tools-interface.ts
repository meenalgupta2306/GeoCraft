import { GeoCraftViewComponent } from "../../view/geo-craft-view/geo-craft-view.component";

export interface Tool {

  validate(step: any, labelSensitive: boolean): void;
  handlePointerDown(view: GeoCraftViewComponent, x: number, y: number): void;
  handlePointerUp(view: GeoCraftViewComponent, x: number, y: number): void;
}

import { GeoCraftViewComponent } from "../../view/geo-craft-view/geo-craft-view.component";

export interface Tool {

  validate(params: any, labelSensitive: boolean): boolean;
  handlePointerDown?(view: GeoCraftViewComponent, x: number, y: number): void;
  handlePointerUp?(view: GeoCraftViewComponent, x: number, y: number): void;
  handleMove?(view: GeoCraftViewComponent, x: number, y: number): void;
  handleClick?(view: GeoCraftViewComponent, x: number, y: number): void;
}

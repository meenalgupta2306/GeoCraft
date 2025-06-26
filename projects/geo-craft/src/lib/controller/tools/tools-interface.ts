import { GeoCraftViewComponent } from "../../view/geo-craft-view/geo-craft-view.component";

export abstract class Tool {
  handlePointerDown?(view: GeoCraftViewComponent, x: number, y: number): void;
  handlePointerUp?(view: GeoCraftViewComponent, x: number, y: number): void;
  handleMove?(view: GeoCraftViewComponent, x: number, y: number): void;
  handleClick?(view: GeoCraftViewComponent, x: number, y: number): void;
}

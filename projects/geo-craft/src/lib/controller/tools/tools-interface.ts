import { GeoCraftViewComponent } from "../../view/geo-craft-view/geo-craft-view.component";

export interface Tool {
    handleClick(view: GeoCraftViewComponent, wx: number, wy: number): void;
}
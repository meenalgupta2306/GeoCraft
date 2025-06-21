import { Point } from "../model/point";

export class DrawPoint {

    constructor(
        private point: Point
    ){
    }
   

    render(renderer: any, view: any) {
        const sx = view.toScreenX(this.point.x);
        const sy = view.toScreenY(this.point.y);
        renderer.drawCircle(sx, sy, 4);
    }
}
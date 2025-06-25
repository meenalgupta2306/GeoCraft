import { Point } from "../model/point";

export class DrawPoint {

    constructor(
        private point: Point,
        private isTemporary: boolean = false
    ){
    }
   

    render(renderer: any, view: any) {
        const sx = view.toScreenX(this.point.x);
        const sy = view.toScreenY(this.point.y);

        const radius = this.isTemporary ? 3 : 4;
        const color = this.isTemporary ? 'gray' : 'black';
        renderer.drawCircle(sx, sy, radius, color);
    }
}
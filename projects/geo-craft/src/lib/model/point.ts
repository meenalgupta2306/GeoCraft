export class Point {
    readonly tool = "point";
    x: number;
    y: number;
    label: string;

    constructor(x: number, y: number, label?: string) {
        this.x = x;
        this.y = y;
        this.label = label?? '';
    }

    public distanceTo(x1: number,y1: number) {
        //computes length of the hypotenuse in a right triangle
		return Math.hypot(this.x - x1, this.y - y1);
	}

    getX(){
        return this.x;
    }

    getY(){
        return this.y;
    }

    equals(object: unknown): boolean {
        if (!(object instanceof Point)) {
            return false;
        }
        return this.x === object.x && this.y === object.y;
    }
}
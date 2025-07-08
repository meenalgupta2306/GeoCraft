export interface GeoRef {
    render(): void,
    toScreenX(x: number): number
    toScreenY(y: number): number
    toWorldY(y: number): number
    toWorldX(x: number): number
}

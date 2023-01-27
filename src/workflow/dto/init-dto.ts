export class InitDto {

    constructor(
        public readonly captures: Map<string, CaptureDto>, 
        public readonly zones: Map<number, ZoneDto>
    ){
    }

    public toJson(): string {
        return `{ "captures": ${JSON.stringify(Object.fromEntries(this.captures))}, "zones": ${JSON.stringify(Object.fromEntries(this.zones))} }`;
    }
}

export interface CaptureDto {
    x: number, y: number, width: number, height: number
} 

export interface ZoneDto {
    offsetX: number, offsetY: number, width: number, height: number, deviceName: string
}
import { Injectable } from '@angular/core';
import { config } from '../config/config.json';

@Injectable({
  providedIn: 'root',
})
export class ConstructionService {
  constructor() {}
  private geoElements: any[] = [];

  addGeoElement(geo: any) {
    this.geoElements.push(geo);
  }

  getLastGeoElement(): any {
    return this.geoElements[this.geoElements.length - 1];
  }

  getGeoElements() {
    return this.geoElements;
  }

  getGeoElementByIndex(index: number){
    return this.geoElements[index];
  }
  updateGeoElement(index: number, geo: any) {
    this.geoElements[index] = geo;
  }

  getLength(){
    return this.geoElements.length -1;
  }

  clear() {
    this.geoElements = [];
  }
}

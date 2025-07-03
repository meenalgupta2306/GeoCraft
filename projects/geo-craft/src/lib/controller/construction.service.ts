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
    console.log(this.geoElements);
  }

  getLastGeoElement(): any {
    return this.geoElements[this.geoElements.length - 1];
  }

  getGeoElements() {
    return this.geoElements;
  }

  clear() {
    this.geoElements = [];
  }
}

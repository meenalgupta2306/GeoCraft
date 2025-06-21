import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConstructionService {

  constructor() { }
  private geoElements: any[] = [];

  addGeoElement(geo: any) {
    this.geoElements.push(geo);
    console.log(this.geoElements)
  }

  getGeoElements() {
    return this.geoElements;
  }

  clear() {
    this.geoElements = [];
  }
}

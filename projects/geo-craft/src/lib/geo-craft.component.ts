import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'lib-geo-craft',
  templateUrl: './geo-craft.component.html',
   styleUrls: ['./geo-craft.component.scss'],
})
export class GeoCraftComponent implements OnInit {

  openToolBar: boolean = true;

  constructor() { }

  ngOnInit(): void {
  }

  toggle(){
    this.openToolBar = !this.openToolBar;
  }

}

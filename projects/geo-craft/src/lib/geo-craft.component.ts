import { Component, OnInit, Input } from '@angular/core';
import { ViewStateService } from './view/services/view-state.service';

@Component({
  selector: 'lib-geo-craft',
  templateUrl: './geo-craft.component.html',
   styleUrls: ['./geo-craft.component.scss'],
})
export class GeoCraftComponent implements OnInit {
  config = {
    showGrid: true,
    snapToGrid: true,
    gridStep: 1
  };

  openToolBar: boolean = true;
  currentQuestion = 0;

  constructor(
    private viewState: ViewStateService
  ) { }

  ngOnInit(): void {
    this.viewState.setCanvasConfig(this.config);
  }

  toggle(){
    this.openToolBar = !this.openToolBar;
  }

  next(){
    this.currentQuestion ++;
    if(this.currentQuestion == 5) this.currentQuestion=0;
  }

}

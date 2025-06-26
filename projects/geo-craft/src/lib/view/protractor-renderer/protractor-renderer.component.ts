import { Component, OnInit } from '@angular/core';
import { ViewStateService } from '../services/view-state.service';

@Component({
  selector: 'lib-protractor-renderer',
  templateUrl: './protractor-renderer.component.html',
  styleUrls: ['./protractor-renderer.component.scss']
})
export class ProtractorRendererComponent implements OnInit {

 radius: number = 250;
 
   centerX;
   centerY;
 
   constructor(
     public viewState: ViewStateService
   ) {
      this.centerX = viewState.canvasWidth / 2;
      this.centerY = viewState.canvasHeight / 2;
    }
 
   ngOnInit(): void {
   }
   get ticks() {
    const result = [];
    for (let angle = 0; angle <= 180; angle++) {
      let type = 'minor';
      if (angle % 10 === 0) type = 'major';
      else if (angle % 5 === 0) type = 'medium';

      result.push({ angle, type });
    }
    return result;
  }

  polar(angle: number, r: number): { x: number, y: number } {
    const rad = angle * Math.PI / 180;
    return {
      x: this.centerX + r * Math.cos(rad),
      y: this.centerY - r * Math.sin(rad)
    };
  }

 labelAt(angle: number, r: number) {
  return this.polar(angle, r);
}


}



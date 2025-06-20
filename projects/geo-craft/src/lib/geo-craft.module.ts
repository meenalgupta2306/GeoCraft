import { NgModule } from '@angular/core';
import { GeoCraftComponent } from './geo-craft.component';
import { CompassComponent } from './components/tools/compass/compass.component';
import { ToolBarComponent } from './components/tool-bar/tool-bar.component';
import { CanvasBoardComponent } from './components/canvas-board/canvas-board.component';
import { CommonModule } from '@angular/common';
import { PointComponent } from './components/tools/point/point.component'; 


@NgModule({
  declarations: [
    GeoCraftComponent,
    CompassComponent,
    ToolBarComponent,
    CanvasBoardComponent,
    PointComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    GeoCraftComponent
  ]
})
export class GeoCraftModule { }

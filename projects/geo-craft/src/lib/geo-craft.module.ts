import { NgModule } from '@angular/core';
import { GeoCraftComponent } from './geo-craft.component';
import { CommonModule } from '@angular/common';
import { GeoCraftViewComponent } from './view/geo-craft-view/geo-craft-view.component'; 
import { ToolBarComponent } from './view/tool-bar/tool-bar.component';
import { FormsModule } from '@angular/forms';
import { CompassRendererComponent } from './view/compass-renderer/compass-renderer.component';


@NgModule({
  declarations: [
    GeoCraftComponent,
    ToolBarComponent,
    GeoCraftViewComponent,
    CompassRendererComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    GeoCraftComponent
  ]
})
export class GeoCraftModule { }

import { NgModule } from '@angular/core';
import { GeoCraftComponent } from './geo-craft.component';
import { CommonModule } from '@angular/common';
import { GeoCraftViewComponent } from './view/geo-craft-view/geo-craft-view.component'; 
import { ToolBarComponent } from './view/tool-bar/tool-bar.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    GeoCraftComponent,
    ToolBarComponent,
    GeoCraftViewComponent
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

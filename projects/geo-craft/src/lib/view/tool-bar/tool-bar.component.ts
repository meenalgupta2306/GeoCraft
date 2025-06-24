import { Component, OnInit } from '@angular/core';
import { ToolManagerService } from '../../controller/tool-manager.service';
import { ViewStateService } from '../services/view-state.service';
@Component({
  selector: 'lib-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.scss']
})
export class ToolBarComponent implements OnInit {

  tools = [
    {id: 1, name: 'point', 'label': 'Point', icon: ''},
    {id: 2, name: 'line', 'label': 'Line', icon: ''},
    {id: 3, name: 'compass', 'label': 'Compass', icon: ''},
  ]


  constructor(
    private toolManager: ToolManagerService,
    public viewState: ViewStateService
  ) { }

  ngOnInit(): void {
    debugger
  }

  selectTool(toolName: string) {
    debugger
     this.toolManager.setActiveTool(toolName);
  } 
  

}

import { Component, OnInit } from '@angular/core';
import { ToolManagerService } from '../../controller/tool-manager.service';
import { ViewStateService } from '../services/view-state.service';
@Component({
  selector: 'lib-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.scss'],
})
export class ToolBarComponent implements OnInit {
  tools = [
    { id: 1, name: 'point', label: 'Point', icon: 'radio_button_checked' },
    {
      id: 2,
      name: 'segment',
      label: 'Segment',
      icon: 'diagonal_line',
    },
    {
      id: 3,
      name: 'compass',
      label: 'Compass',
      icon: 'architecture',
    },
    {
      id: 4,
      name: 'protractor',
      label: 'Protractor',
      icon: 'looks',
    },
  ];

  constructor(
    public toolManager: ToolManagerService,
    public viewState: ViewStateService
  ) {}

  ngOnInit(): void {}

  selectTool(toolName: string) {
    this.toolManager.setActiveTool(toolName);
  }
}

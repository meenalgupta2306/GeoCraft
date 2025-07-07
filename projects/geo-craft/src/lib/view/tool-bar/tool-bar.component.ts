import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
  passiveTools = ['protractor', 'compass'];
  selectedToolNames: Set<string> = new Set();

  constructor(
    public toolManager: ToolManagerService,
    public viewState: ViewStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  selectTool(toolName: string) {
    this.toolManager.setActiveTool(toolName);
    if (this.selectedToolNames.has(toolName)) {
      this.selectedToolNames.delete(toolName); // deselect if already selected
    } else {
      this.selectedToolNames.add(toolName); // select if not present
    }

    this.cdr.detectChanges();
  }

  isToolActive(toolName: string): boolean {
    const isPassive = this.passiveTools.includes(toolName);
    return isPassive
      ? this.toolManager.isToolRendered(toolName)
      : this.toolManager.activeToolName === toolName;
  }
}

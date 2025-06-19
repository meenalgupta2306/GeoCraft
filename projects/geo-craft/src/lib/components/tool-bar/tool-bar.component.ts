import { Component, OnInit, Input } from '@angular/core';
import { InteractionEventsService } from '../../services/interaction-events.service';
import { ToolDefinition } from '../../models/tool-definition';

@Component({
  selector: 'lib-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.scss']
})
export class ToolBarComponent implements OnInit {
  @Input() allowedToolIds: number[] = [];

  visibleTools: ToolDefinition[] = [];
  tools: ToolDefinition[] =[];

  constructor(
    private interactionEventsService: InteractionEventsService
  ) { }

  ngOnInit(): void {
    this.tools = this.interactionEventsService.tools

    this.visibleTools = this.tools.filter(tool =>
      this.allowedToolIds.includes(tool.id)
    );
  }

  selectTool(tool: ToolDefinition) {
  this.interactionEventsService.setActiveTool(tool.component);
}

}

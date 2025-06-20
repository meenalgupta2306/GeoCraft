import { Component, OnInit, Type } from '@angular/core';
import { InteractionEventsService } from '../../services/interaction-events.service';

@Component({
  selector: 'lib-canvas-board',
  templateUrl: './canvas-board.component.html',
  styleUrls: ['./canvas-board.component.scss'],
})
export class CanvasBoardComponent implements OnInit {
  activeToolComponent: Type<any> | null = null;

  constructor(private interactionEventsService: InteractionEventsService) {}

  ngOnInit(): void {
    this.interactionEventsService.activeTool$.subscribe((component) => {
      this.activeToolComponent = component;
    });
  }
}

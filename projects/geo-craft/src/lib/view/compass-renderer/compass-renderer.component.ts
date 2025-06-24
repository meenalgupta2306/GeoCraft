import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { ViewStateService } from '../services/view-state.service';

@Component({
  selector: 'lib-compass-renderer',
  templateUrl: './compass-renderer.component.html',
  styleUrls: ['./compass-renderer.component.scss'],
})
export class CompassRendererComponent implements AfterViewInit {

  @ViewChild('compassSvg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;
  @ViewChild('compassGroup', { static: true }) compassRef!: ElementRef<SVGGElement>;
  @ViewChild('pencilElement', { static: true }) pencilRef!: ElementRef<SVGGElement>;
  @ViewChild('needleLeg', { static: true }) needleRef!: ElementRef<SVGGElement>;
  @ViewChild('pivotJoint', { static: true }) pivotRef!: ElementRef<SVGGElement>;
  @ViewChild('drawingPath', { static: true }) pathRef!: ElementRef<SVGPathElement>;

  centerX;
  centerY;

  pivotX = 0; // in world units
  pivotY = 0;


  openingAngle: number = 0;
  rotationAngle: number = 0;
  radiusLocked: boolean = false;

  draggingPencilForRadius: boolean = false;
  rotating: boolean = false;

  movingCompass: boolean = false;

  startMouseX: number = 0;
  startAngle: number = 0;

  dragStartX: number = 0;
  dragStartY: number = 0;
  originalCenterX: number = 0;
  originalCenterY: number = 0;

  pathData: string = '';

    constructor(public viewState: ViewStateService){
     this.centerX = viewState.canvasWidth / 2;
     this.centerY = viewState.canvasHeight / 2;
  }

  ngAfterViewInit(): void {
  
    const pencil = this.pencilRef.nativeElement;
    const needle = this.needleRef.nativeElement;

    // Toggle lock/unlock
    this.pivotRef.nativeElement.addEventListener('click', () => {
      this.radiusLocked = !this.radiusLocked;
      alert(this.radiusLocked ? 'Radius Locked' : 'Radius Unlocked');
    });

    // Pencil drag handlers
    const pencilDown = (clientX: number) => {
      if (this.radiusLocked) {
        this.rotating = true;
      } else {
        this.draggingPencilForRadius = true;
        this.startMouseX = clientX;
        this.startAngle = this.openingAngle;
      }
    };

    const pencilMove = (clientX: number) => {
      if (this.radiusLocked && this.rotating) {
        this.rotationAngle += (clientX - this.startMouseX) * 0.5;
        this.startMouseX = clientX;
        this.updateCompass();
      } else if (this.draggingPencilForRadius) {
        const deltaX = clientX - this.startMouseX;
        const factor = 2;
        let newAngle = this.startAngle + deltaX / factor;
        newAngle = Math.max(0, Math.min(90, newAngle));
        this.openingAngle = newAngle;
        this.updateCompass();
      }
    };

    const pencilUp = () => {
      this.draggingPencilForRadius = false;
      this.rotating = false;
    };

    // Pencil mouse + touch events
    pencil.addEventListener('mousedown', (e: MouseEvent) => {
      this.startMouseX = e.clientX;
      pencilDown(e.clientX);
    });
    document.addEventListener('mousemove', (e: MouseEvent) => pencilMove(e.clientX));
    document.addEventListener('mouseup', pencilUp);

    pencil.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length > 0) {
        this.startMouseX = e.touches[0].clientX;
        pencilDown(e.touches[0].clientX);
      }
    });
    document.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length > 0) pencilMove(e.touches[0].clientX);
    });
    document.addEventListener('touchend', pencilUp);
    document.addEventListener('touchcancel', pencilUp);

    // Compass move handlers (needle drag)
    needle.addEventListener('mousedown', (e: MouseEvent) => {
      this.movingCompass = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.originalCenterX = this.centerX;
      this.originalCenterY = this.centerY;
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.movingCompass) return;
      this.centerX = this.originalCenterX + (e.clientX - this.dragStartX);
      this.centerY = this.originalCenterY + (e.clientY - this.dragStartY);
      this.updateCompass();
    });

    document.addEventListener('mouseup', () => {
      this.movingCompass = false;
    });

    needle.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length > 0) {
        this.movingCompass = true;
        this.dragStartX = e.touches[0].clientX;
        this.dragStartY = e.touches[0].clientY;
        this.originalCenterX = this.centerX;
        this.originalCenterY = this.centerY;
      }
    });

    document.addEventListener('touchmove', (e: TouchEvent) => {
      if (!this.movingCompass || e.touches.length === 0) return;
      this.centerX = this.originalCenterX + (e.touches[0].clientX - this.dragStartX);
      this.centerY = this.originalCenterY + (e.touches[0].clientY - this.dragStartY);
      this.updateCompass();
    });

    document.addEventListener('touchend', () => {
      this.movingCompass = false;
    });
    document.addEventListener('touchcancel', () => {
      this.movingCompass = false;
    });

    // Initial render
    this.updateCompass();
    
  }

  updateCompass(): void {
    const compass = this.compassRef.nativeElement;

    // // This is the tip of the needle in local compass coordinates:
    const tipX = 22;
    const tipY = -20;

    const translateX = this.centerX - tipX;
    const translateY = this.centerY - tipY;
    compass.setAttribute(
      'transform',
      `translate(${translateX}, ${translateY}) rotate(${this.rotationAngle}, ${tipX}, ${tipY})`
    );

    console.log("needle tip at", this.viewState.toWorldX(this.centerX), this.viewState.toWorldY(this.centerY));
  
    // Spread pencil leg:
    const halfAngle = this.openingAngle / 2;
    const pivotX = 80;
    const pivotY = -180;
    this.pencilRef.nativeElement.setAttribute(
      'transform',
      `rotate(${-halfAngle}, ${pivotX}, ${pivotY})`
    );
  }


//   getPencilTip(): [number, number] {
//   const pivotX = 80;
//   const pivotY = -180;
//   const tipX = 115;
//   const tipY = -20;

//   // 1) Spread rotation (opening angle)
//   const spreadRad = (-this.openingAngle / 2) * Math.PI / 180;

//   const dx = tipX - pivotX;
//   const dy = tipY - pivotY;

//   const spreadX = dx * Math.cos(spreadRad) - dy * Math.sin(spreadRad) + pivotX;
//   const spreadY = dx * Math.sin(spreadRad) + dy * Math.cos(spreadRad) + pivotY;

//   // 2) Rotate whole compass around the NEEDLE TIP (which is base point)
//   const needleTipX = 22;  // matches your compass base polygon
//   const needleTipY = -20;

//   const compassRad = this.rotationAngle * Math.PI / 180;

//   // move to needle base
//   const relX = spreadX - needleTipX;
//   const relY = spreadY - needleTipY;

//   const rotatedX = relX * Math.cos(compassRad) - relY * Math.sin(compassRad) + needleTipX;
//   const rotatedY = relX * Math.sin(compassRad) + relY * Math.cos(compassRad) + needleTipY;

//   // 3) Add global position
//   return [this.centerX + (rotatedX - needleTipX), this.centerY + (rotatedY - needleTipY)];
// }
 /*  @ViewChild('compassGroup', { static: true })
  compassRef!: ElementRef<SVGGElement>;

  pivotX = 0;
  pivotY = 0;

  constructor(public viewState: ViewStateService) {}

  ngAfterViewInit() {
    this.placeCompass();
  }

  placeCompass() {
    const screenX = this.viewState.toScreenX(this.pivotX);
    const screenY = this.viewState.toScreenY(this.pivotY);
    this.compassRef.nativeElement.setAttribute(
      'transform',
      `translate(${screenX}, ${screenY})`
    );
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent) {
    // Prevent default so canvas doesn’t interfere
    event.stopPropagation();
    event.preventDefault();

    // Listen to move
    const move = (moveEvent: PointerEvent) => {
      const rect = (event.target as Element).getBoundingClientRect();
      const screenX = moveEvent.clientX - rect.left;
      const screenY = moveEvent.clientY - rect.top;

      // Convert to RW
      this.pivotX = this.viewState.toWorldX(screenX);
      this.pivotY = this.viewState.toWorldY(screenY);

      this.placeCompass();
    };

    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  } */
}

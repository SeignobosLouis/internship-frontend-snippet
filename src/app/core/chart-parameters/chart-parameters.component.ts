import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-chart-parameters',
  templateUrl: './chart-parameters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './chart-parameters.component.scss'
})
export class ChartParametersComponent {

  @Input() zoom!: number;

  @Output() zoomChange = new EventEmitter<number>();
  @Output() emitFullScreen = new EventEmitter<void>();

  public emitZoom(): void {
    this.zoomChange.emit(this.zoom);
  }

  public emitFullScreenEvent(): void {
    this.emitFullScreen.emit();
  }

}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-team-info',
  templateUrl: './team-info.component.html',
  styleUrls: ['./team-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamInfoComponent {
  @Input() version: string = "???";
}

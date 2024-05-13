import { Component, ChangeDetectionStrategy, Output, EventEmitter, ChangeDetectorRef } from "@angular/core";
import { IToastType } from "src/app/interfaces/toast.interface";
import { ApiService } from "src/app/services/api.service";
import { SitacService } from "src/app/services/sitac.service";
import { environment } from "src/environments/environment";
import { AppComponent } from "../app/app.component";
import { ISitacConfig } from "src/app/interfaces/sitac-data.interface";

@Component({
  selector: 'app-settings-panels',
  templateUrl: './settings-panels.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './settings-panels.component.scss',
})
export class SettingsPanelsComponent {

  /**
   * Event emitter for toasts
   */
  @Output() toasts = new EventEmitter<IToastType>();

  /**
   * Event emitter for the number of mobiles
   */
  @Output() emitMobiles = new EventEmitter<number>();

  /**
   * Event emitter for the refresh period
   */
  @Output() emitRefresh = new EventEmitter<number>();

  /**
   * Event emitter for the number of videos
   */
  @Output() emitVideo = new EventEmitter<number>();

  /**
   * Event emitter for the number of sectors
   */
  @Output() emitSectors = new EventEmitter<number>();

  /**
   * Event emitter for the number of quarters
   */
  @Output() emitQuarters = new EventEmitter<number>();

  /**
   * Event emitter for the radius
   */
  @Output() emitRadius = new EventEmitter<number>();

  /**
   * Event emitter for the distributions
   */
  @Output() emitDistributions = new EventEmitter<number[]>();

  /**
   * Number of sectors in the simulation (not modifiable by the user)
   */
  public sectors: number = AppComponent.nbSectors;

  /**
   * Number of quarters in the simulation (not modifiable by the user)
   */
  public quarters: number = AppComponent.nbQuarters;

  /**
   * Distributions of the simulation (not modifiable by the user)
   */
  public distributions: number[] = AppComponent.distribution;

  /**
   * Radius of the simulation in meters (not modifiable by the user)
   */
  public radius?: number;

  /**
   * Number of mobiles in the simulation
   */
  public mobiles?: number;

  /**
   * Refresh period of the simulation in ms
   */
  public refresh?: number;

  /**
   * Number of displayed videos in the simulation at the same time
   */
  public video: number = 10;

  /**
   * Constructor
   * @param sitacService - The Sitac service (Injectable)
   * @param apiService - The API service (Injectable)
   * @param cdr - The ChangeDetectorRef (Injectable)
   */
  constructor(
    private sitacService: SitacService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.sitacService.sitacConfigUpdateEvent$.subscribe((config: ISitacConfig | void) => {
      if (config) {
        this.refresh = config.updatePeriodMs;
        this.radius = config.maxMobileDistanceFromCenterM;
      }
      this.mobiles = sitacService.mobiles.length;
      this.cdr.detectChanges();
    });
  }

  /**
   * Apply the settings to the simulation
   * @param _mobiles - The new number of mobiles
   * @param _refresh - The new refresh period
   * @param _video - The new number of videos
   * @param _rayon - The new radius
   * @param _sectors - The new number of sectors
   * @param _quarters - The new number of quarters
   * @param _distribution1 - The new distribution for the first interval
   * @param _distribution2 - The new distribution for the second interval
   * @param _distribution3 - The new distribution for the third interval
   * @returns void
   */
  public applySettings(_mobiles: string, _refresh: string, _video: string, _rayon: string, _sectors: string, _quarters: string, _distribution1: string, _distribution2: string, _distribution3: string): void {
    const mobiles: number = parseInt(_mobiles);
    const refresh: number = parseInt(_refresh);
    const video: number = parseInt(_video);
    const rayon: number = parseInt(_rayon);
    const sectors: number = parseInt(_sectors);
    const quarters: number = parseInt(_quarters);
    const distribution1: number = parseInt(_distribution1);
    const distribution2: number = parseInt(_distribution2);
    const distribution3: number = parseInt(_distribution3);
    // Check if the values are valid and different from the current ones before applying them
    if (!isNaN(mobiles) && mobiles > 0 && mobiles != this.mobiles) this.applyMobileSettings(mobiles);
    if (!isNaN(refresh) && refresh >= 100 && refresh != this.refresh) this.applyRefreshSettings(refresh);
    if (!isNaN(video) && video > 0 && video != this.video) this.applyVideoSettings(video);
    if (!isNaN(rayon) && rayon > 0 && rayon != this.radius) this.applyRayonSettings(rayon);
    if (!isNaN(sectors) && sectors > 0 && sectors != this.sectors) this.applySectorsSettings(sectors);
    if (!isNaN(quarters) && quarters > 0 && quarters != this.quarters) this.applyQuartersSettings(quarters);
    if ((!isNaN(distribution1) && !isNaN(distribution2) && !isNaN(distribution3)) && (distribution1 != this.distributions[0] || distribution2 != this.distributions[1] || distribution3 != this.distributions[2])) this.applyDistributionsSettings(distribution1, distribution2, distribution3);
  }

  /**
   * Apply the new distributions to the simulation
   * @param distribution1 - The new distribution for the first interval
   * @param distribution2 - The new distribution for the second interval
   * @param distribution3 - The new distribution for the third interval
   * @returns void
   */
  private applyDistributionsSettings(distribution1: number, distribution2: number, distribution3: number): void {
    if (distribution1 < 0 || distribution2 < distribution1 + 1 || distribution3 < distribution2 + 1) {
      this.toasts.emit({ message: 'Les valeurs de distribution ne sont pas valides', type: 'error' });
      return;
    }
    this.toasts.emit({ message: 'Les valeurs de distribution ont été mises à jour', type: 'info' });
    this.distributions = [distribution1, distribution2, distribution3];
    this.emitDistributions.emit(this.distributions);
  }

  /**
   * Update the repartition of mobiles (call Angular change detection manually)
   * @returns void
   */
  public updateRepartitionMobiles(): void {
    this.cdr.detectChanges();
  }

  /**
   * Applies the specified number of videos to the settings.
   * @param video - The number of videos to apply.
   * @returns void
   */
  private applyVideoSettings(video: number): void {
    this.video = video;
    this.toasts.emit({ message: 'Le nombre de vidéos a été mis à jour', type: 'info' });
    this.emitVideo.emit(video);
  }

  /**
   * Applies the specified radius to the settings.
   * @param rayon - The radius to apply.
   * @returns void
   */
  private applyRayonSettings(rayon: number): void {
    this.radius = rayon;
    this.toasts.emit({ message: 'Le rayon de la simulation a été mis à jour', type: 'info' });
    this.emitRadius.emit(rayon);
  }

  /**
   * Applies the specified number of sectors to the settings.
   * @param sectors - The number of sectors to apply.
   * @returns void
   */
  private applySectorsSettings(sectors: number): void {
    this.sectors = sectors;
    this.toasts.emit({ message: 'Le nombre de secteurs a été mis à jour', type: 'info' });
    this.emitSectors.emit(sectors);
  }
  
  /**
   * Applies the specified number of quarters to the settings.
   * @param quarters - The number of quarters to apply.
   * @returns void
   */
  private applyQuartersSettings(quarters: number): void {
    this.quarters = quarters;
    this.toasts.emit({ message: 'Le nombre de quartiers a été mis à jour', type: 'info' });
    this.emitQuarters.emit(quarters);
  }

  /**
   * Apply the new refresh period to the simulation
   * @param refresh - The new refresh period
   * @returns void
   */
  private applyRefreshSettings(refresh: number): void {
    this.emitRefresh.emit(refresh);
    this.apiService.put(refresh, environment.refreshPeriodPath).subscribe({
      next: () => {
        const message: string = 'La période de rafraîchissement a été modifiée à ' + refresh + 'ms';
        this.toasts.emit({ message, type: 'info' });
        this.refresh = refresh;
      },
      error: () => {
        const errorMessage: string = 'Une erreur s\'est produite lors de la mise à jour de la période de rafraîchissement';
        this.toasts.emit({ message: errorMessage, type: 'error' });
      },
    });
  }

  /**
   * Apply the new number of mobiles to the simulation
   * @param mobiles - The new number of mobiles
   * @returns void
   */
  private applyMobileSettings(mobiles: number): void {
    this.apiService.put(mobiles, environment.mobilesSizePath).subscribe({
      next: () => {
        const message = 'La taille de la simulation a été modifiée à ' + mobiles + ' mobiles';
        this.toasts.emit({ message, type: 'info' });
        this.mobiles = mobiles;
      },
      error: () => {
        const errorMessage: string = "Une erreur s'est produite lors de la mise à jour de la taille de la simulation";
        this.toasts.emit({ message: errorMessage, type: 'error' });
      },
    });
    this.emitMobiles.emit(mobiles);
  }
}

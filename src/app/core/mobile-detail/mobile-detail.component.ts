import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { ISitacSvgMobile } from 'src/app/interfaces/sitac-data.interface';
import { IToastType } from 'src/app/interfaces/toast.interface';
import { SitacService } from 'src/app/services/sitac.service';

@Component({
  selector: 'app-mobile-detail',
  templateUrl: './mobile-detail.component.html',
  styleUrl: './mobile-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileDetailComponent {

  /**
   * Event emitter for toasts
   */
  @Output() toasts = new EventEmitter<IToastType>();

  /**
   * Mobile local copy for non-direct update 
   * through original mobile object reference
   */
  public mobileLocalCopy: ISitacSvgMobile | null = null;

  /**
   * Mobile selected mobile reference
   */
  public selectedMobile: ISitacSvgMobile | null = null;

  /**
   * Constructor of the mobileDisplayComponent
   * @param cdr Injected ChangeDetectorRef
   */
  constructor(private sitacService: SitacService, private cdr: ChangeDetectorRef) {
    this.sitacService.sitacMobilesUpdateEvent$.subscribe(event => {
      if (event === 'MOBILES_DELETED') { 
        if (this.selectedMobile && !this.sitacService.mobiles.find((m => m.id === this.selectedMobile?.id ))) {
          this.mobileLocalCopy = null;
          this.cdr.detectChanges();
        }
      } else if (event === 'MOBILES_CREATED') {
        const mobile = this.sitacService.mobiles.find((m => m.id === this.selectedMobile?.id))
        if (mobile !== undefined) {
          this.selectedMobile = mobile as ISitacSvgMobile;
          this.mobileLocalCopy = {...this.selectedMobile};
          this.cdr.detectChanges();
        }
      }
    })
  }

  /**
   * This verify Angular lifecycle hook change
   * It's called each time the selected mobile is updated 
   * @returns void
   */
  public onChangeCdr(): void {
    this.cdr.detectChanges();
  }

  /**
   * Select (or unselect) a mobile
   * @param selectedMobile the selected mobile object
   * @returns void
   */
  public selectMobile(selectedMobile: ISitacSvgMobile): void {
    if (this.selectedMobile === selectedMobile) {
      this.selectedMobile = null;
      this.mobileLocalCopy = null;
    } else {
      this.mobileLocalCopy = { ...selectedMobile };
      this.selectedMobile = selectedMobile;
    }
    this.cdr.detectChanges();
  }

  /**
   * Update selected mobile data
   * @returns void
  */
  public updateSelectedMobile(): void {
    if (this.mobileLocalCopy && this.selectedMobile) {
      this.mobileLocalCopy = { ...this.selectedMobile };
      this.updateLocalSelectedMobile();
    }
  }

  /**
   * Update local selected mobile data
   * @returns void
  */
  public updateLocalSelectedMobile(): void {
    if (this.mobileLocalCopy && this.selectedMobile) {
      this.selectedMobile.environment = this.mobileLocalCopy.environment;
      this.selectedMobile.shape = this.mobileLocalCopy.shape;
      this.selectedMobile.color = this.mobileLocalCopy.color;
      this.toasts.emit({ message: 'Les informations du mobile ont été mises à jour', type: 'info' });
      this.cdr.detectChanges();
    }
  }
}

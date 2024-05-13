import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { IToastType } from 'src/app/interfaces/toast.interface';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent {

  constructor(private cdr: ChangeDetectorRef) { }

  /**
   * List of toasts to display
   */
  public toasts: {
    message: string;
    time: string;
    type: string;
    title: string;
  }[] = [];

  /**
   * Add a toast to the list
   * @param data - The data of the toast to add
   * @returns void
   */
  public addToast(data: IToastType): void {
    const { message, type } = data;
    this.toasts.push({
      message,
      time: this.getCurrentTime(),
      type,
      title: type === 'error' ? 'Erreur' : 'Information'
    });
    this.cdr.detectChanges();
    setTimeout(() => this.removeToast(0), 5000);
  }

  /**
   * Get the current time for the toast
   * @returns string - The current time as a string
   */
  private getCurrentTime(): string {
    return new Date().toLocaleTimeString();
  }

  /**
   * Remove a toast from the list
   * @param index - The index of the toast to remove
   * @returns void
   */
  public removeToast(index: number): void {
    this.toasts.splice(index, 1);
    this.cdr.detectChanges();
  }
}

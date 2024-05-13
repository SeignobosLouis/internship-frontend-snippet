import { Component, ChangeDetectionStrategy, ElementRef, Renderer2, ChangeDetectorRef, Output, EventEmitter, QueryList, ViewChildren, OnInit } from "@angular/core";
import flvjs from 'flv-h265.js';
import { IToastType } from "src/app/interfaces/toast.interface";

/**
 * Represents the VideoComponent class.
 * This component is responsible for displaying videos.
 */
@Component({
  selector: 'app-video',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './video.component.html',
  styleUrl: './video.component.scss'
})
export class VideoComponent implements OnInit {

  /**
   * The video elements reference.
   */
  @ViewChildren('videoElement') videoElementsRef!: QueryList<ElementRef>;

  /**
   * Event emitter for toasts
   */
  @Output() toasts = new EventEmitter<IToastType>();

  /**
   * The base URI for the videos.
   */
  private videosBaseUri: string = 'http://localhost:7001';

  /**
   * The extensions for the videos.
   */
  private videosExtensions: string = '.mp4';

  /**
   * The maximum video index.
   */
  private maxVideoIndex = 20;

  /**
   * Array of video numbers.
   */
  public videos: number[] = [];

  /**
   * Flag indicating whether a video is in fullscreen mode.
   */
  public isFullscreen: boolean = false;

  /**
   * The video currently being displayed in the modal.
   * If the value is -1, no video is being displayed.
   */
  public modalIndex: number = -1;

  /**
   * The scale of the video.
   */
  public scale: number = 1;

  /**
   * Flag indicating whether an error has occurred.
   * This flag is used to prevent multiple toasts from being displayed.
   */
  private hasError: boolean = false;

  /**
   * The private list of ready videos.
   * This list is used to store the videos that are ready to be played.
   */
  private videosReady: flvjs.Player[] = [];

  /** 
   * Constructor
   * @param renderer - The renderer to use. (Injected Service)
   * @param cdr - The change detector to use. (Injected Service)
   */
  constructor(private renderer: Renderer2, private cdr: ChangeDetectorRef) {
  }

  /**
   * Initializes the component.
   * This method is called after the component has been created.
   * @returns void
   */
  public ngOnInit(): void {
    // Initialize the videos.
    this.updateVideo(10);
  }

  /**
   * Check if all videos are ready to play and play them.
   * @returns void
   */
  private playReadyVideos(): void {
    if (this.videosReady.length === this.videos.length) {
      // If the videos are ready to play (loaded), play them.
      this.videosReady.forEach((flvPlayer) => {
        flvPlayer.play();
      });
    }
  }

  /**
   * Pause the video and add it to the list of ready videos.
   * @param video - The video to add.
   * @returns void
   */
  private addVideoToReadyState(video: flvjs.Player): void {
    video.pause();
    video.currentTime = 0;
    this.videosReady.push(video);
    this.playReadyVideos();
  }

  /**
   * Handles the error that occurred while trying to play the video.
   * @param flvPlayer - The video player.
   * @returns void
   */
  private handleFlvPlayerError(flvPlayer: flvjs.Player) {
    // Try to play the video.
    const flv: void | Promise<void> = flvPlayer.play();
    if (flv) {
      flv.then(() => {
        // The video is ready to play. Pause the video and add it to the list of ready videos.
        this.addVideoToReadyState(flvPlayer);
      }).catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          // The video cannot be played because the user has not allowed it.
          // Try to play the video again after a delay.
          setTimeout(() => {
            this.handleFlvPlayerError(flvPlayer);
          }, 1000);
        } else if (!this.hasError && error instanceof DOMException && error.name === 'NotSupportedError') {
          // The video cannot be played because the browser does not support it.
          this.toasts.emit({ type: 'error', message: 'Votre navigateur ne supporte pas la lecture de vidéos.' });
          // Set the error flag to prevent multiple toasts from being displayed.
          this.hasError = true;
        }
      })
    } else {
      // An error occurred while trying to play the video.
      this.toasts.emit({ type: 'error', message: 'Une erreur s\'est produite lors de la lecture de la vidéo.' });
    }
  }

  /**
   * Instanciates the video players and adds them to the list of ready videos.
   * @param videoCount - The number of videos to add.
   * @returns void
   */
  private addVideos(videoCount: number) {
    const oldVideoCount: number = this.videos.length;
    // Iterate over the videos to add.
    this.videos = Array.from({ length: videoCount }, (_, i) => i % this.maxVideoIndex);
    this.cdr.detectChanges();
    const videoElements: ElementRef<HTMLMediaElement>[] = this.videoElementsRef.toArray();
    if (flvjs.isSupported()) {
      for (let index = oldVideoCount; index < videoCount; index++) {
        const videoElement: HTMLMediaElement = videoElements[index].nativeElement;
        const url: string = this.videosBaseUri + '/video_' + (((index) % this.maxVideoIndex) + 1) + this.videosExtensions;
        // Create the video player for H265 videos.
        const flvPlayer = flvjs.createPlayer({
          type: 'mp4',
          url,
          hasAudio: false,
          hasVideo: true,
        }, {
          enableWorker: false,
          stashInitialSize: 128,
          seekType: 'range',
          enableStashBuffer: true,
        });
        flvPlayer.attachMediaElement(videoElement);
        flvPlayer.load();
        const flv: void | Promise<void> = flvPlayer.play();
        if (flv) {
          flv.then(() => {
            // The video is ready to play. Pause the video and add it to the list of ready videos.
            this.addVideoToReadyState(flvPlayer);
          }).catch(() => {
            // Wait 0.5s before trying to play the video again.
            setTimeout(() => {
              this.handleFlvPlayerError(flvPlayer);
            }, 500);
          });
        }
      }
    } else {
      this.toasts.emit({ type: 'error', message: 'Votre navigateur ne supporte pas la lecture de vidéos.' });
    }
  }

  /**
   * Find the video by index. If the video is found, return it. Otherwise, return undefined.
   * @param index - The index of the video to find.
   * @returns flvjs.Player | undefined
   */
  private findVideoByIndex(index: number): flvjs.Player | undefined {
    return this.videosReady.find((video: unknown) => (video as { _mediaElement: { id: string } })._mediaElement.id === 'video' + index);
  }

  /**
   * Skip the video backward by 15 seconds.
   * @param index - The index of the video to skip.
   * @returns void
   */
  public skipBackward(index: number): void {
    const video: flvjs.Player | undefined = this.findVideoByIndex(index);
    if (video) video.currentTime -= 15;
  }

  /**
   * Skip the video forward by 15 seconds.
   * @param index - The index of the video to skip.
   * @returns void
   */
  public skipForward(index: number): void {
    const video: flvjs.Player | undefined = this.findVideoByIndex(index);
    if (video) video.currentTime += 15;
  }

  /**
   * Updates the video list based on the number of videos to display.
   * @param video - The number of videos to update.
   * @returns void
   */
  public updateVideo(video: number): void {
    // Because we need to iterate over the videos in the template, we need to create a new array.
    if (this.videos.length === video) {
      // The number of videos has not changed. Do nothing.
      return;
    } else if (this.videos.length > video) {
      // We need to remove the videos that are no longer needed.
      const deletedVideos: flvjs.Player[] = this.videosReady.splice(video, this.videos.length - video);
      this.videos.splice(video, this.videos.length - video);
      deletedVideos.forEach(player => {
        player.destroy();
      });
    } else {
      // We need to add the videos that are needed.
      this.addVideos(video);
    }
    this.cdr.detectChanges();
    this.playReadyVideos();
  }

  /**
   * Opens the modal to display the video.
   * The modal is displayed when the user clicks on a video.
   * @param video - The video ID to display.
   * @returns void
   */
  public openModal(video: number): void {
    this.modalIndex = video;
    // Add the modal-open class to the body (to prevent the background from scrolling)
    this.renderer.addClass(document.body, 'modal-open');
  }

  /**
   * Closes the modal.
   * @returns void
   */
  public closeModal(): void {
    // No video is being displayed, so set the modal index to -1.
    this.modalIndex = -1;
    this.renderer.removeClass(document.body, 'modal-open');
  }

}

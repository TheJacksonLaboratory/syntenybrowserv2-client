import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BrowserInterval } from '../../classes/browser-interval';

@Component({
  selector: 'quick-navigation',
  templateUrl: './quick-navigation.component.html',
  styleUrls: ['./quick-navigation.component.scss'],
})
export class QuickNavigationComponent {
  // interval class to get current start and end values
  @Input() interval: BrowserInterval;

  // list of cytogenetic bands available for the current reference chr
  @Input() cytobands: any[];

  // regulates what kind of navigation inputs are displayed
  navType = 'genomic';

  // value of the genomic interval start input
  intervalStart: string;

  // value of the genomic interval end input
  intervalEnd: string;

  // value of the cytogenetic band start input
  cytoStart: string = null;

  // value of the cytogenetic band end input
  cytoEnd: string = null;

  // emits when the interval should be changed based on user input
  @Output() intervalChange: EventEmitter<any> = new EventEmitter<any>();

  /**
   * Updates start values in both navigation types, gets the current interval
   * and emits it for updating the interval in the browser
   * @param {Event} event - change event from the genomic interval start input
   */
  handleStartChange(event: any = null): void {
    if (this.isGenomicInterval()) {
      // get the value entered into the input and assign it to interval start;
      // this way we have a temporary start point to validate before overriding
      // the interval.refStart which could be messy if we screw that up
      this.intervalStart = event.target.value;

      // remove the cytoStart value since it most likely doesn't reflect the new
      // interval start point
      this.cytoStart = null;
    } else {
      // if there isn't an end band, make it the same as the start so that it's
      // easy for the user to select a single band
      if (this.cytoEnd === null) {
        this.cytoEnd = this.cytoStart;
      }

      // remove the genomic interval start since it'll be set to
      // interval.refStart once the new interval is emitted
      this.intervalStart = null;
    }

    // if the interval is valid, emit it to have the interval class navigate to
    // that interval
    const interval = this.getInterval();
    if (interval) {
      this.intervalChange.emit(interval);
    }
  }

  /**
   * Updates end values in both navigation types, gets the current interval and
   * emits it for updating the interval in the browser
   * @param {Event} event - change event from the genomic interval end input
   */
  handleEndChange(event: any = null): void {
    if (this.isGenomicInterval()) {
      // get the value entered into the input and assign it to interval end;
      // this way we have a temporary end point to validate before overriding
      // the interval.refEnd which could be messy if we screw that up
      this.intervalEnd = event.target.value;

      // remove the cytoEnd value since it most likely doesn't reflect the new
      // interval end point
      this.cytoEnd = null;
    } else {
      // remove the genomic interval end since it'll be set to
      // interval.refEnd once the new interval is emitted
      this.intervalEnd = null;
    }

    // if the interval is valid, emit it to have the interval class navigate to
    // that interval
    const interval = this.getInterval();
    if (interval) {
      this.intervalChange.emit(interval);
    }
  }

  /**
   * Returns the interval for the current navigation type where array[0] is the
   * start postion and array[1] is the end position (both in bp)
   */
  getInterval(): number[] {
    if (this.isGenomicInterval()) {
      return this.getGenomicInterval();
    }
    return this.getCytogenticInterval();
  }

  /**
   * Returns a numeric array (if there are values in both cytoStart and cytoEnd)
   * where array[0] is the starting value of the starting band and array[1] is
   * the ending value of the ending band; if there's a missing band, it returns
   * null
   */
  private getCytogenticInterval(): number[] {
    const band1 = this.cytoStart ? this.findBandByLoc(this.cytoStart) : null;
    const band2 = this.cytoEnd ? this.findBandByLoc(this.cytoEnd) : null;

    if (band1 && band2) {
      return band1.start < band2.start
        ? [band1.start, band2.end]
        : [band2.start, band1.end];
    }
    return null;
  }

  /**
   * Returns a numeric array (if there's both a start and an end value) where
   * array[0] is the interval starting value and array[1] is the interval ending
   * value; if there's a missing value, it returns null
   */
  private getGenomicInterval(): number[] {
    const start = this.getGenomicStart();
    const end = this.getGenomicEnd();

    if (start && end) {
      return start > end ? [end, start] : [start, end];
    }
    return null;
  }

  /**
   * Returns the entered genomic start value or the current interval start
   */
  private getGenomicStart(): number {
    return Number(this.intervalStart || this.interval.refStart);
  }

  /**
   * Returns the entered genomic end value or the current interval end
   */
  private getGenomicEnd(): number {
    return Number(this.intervalEnd || this.interval.refEnd);
  }

  /**
   * Returns the cytoband associated with the spcified location
   * @param {string} bandLoc - the location value for the band to search for
   */
  private findBandByLoc(bandLoc: string): any {
    return this.cytobands.filter(b => b.location === bandLoc)[0];
  }

  /**
   * Returns true if the current type of navigation is genomic interval entry
   */
  private isGenomicInterval(): boolean {
    return this.navType === 'genomic';
  }
}

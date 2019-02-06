import {Component} from '@angular/core';
import {TooltipContent} from '../classes/interfaces';

@Component({
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss']
})
export class TooltipComponent {
  data: TooltipContent;
  title: string;
  offsetX: string = '0px';
  offsetY: string = '0px';
  hidden: boolean = true;

  constructor() { }

  // Operational Methods

  /**
   * Displays the tooltip with the specified data and title at the
   * specified x, y position
   * @param {TooltipContent} data - the content to be displayed in the tooltip
   * @param {number} x - the offset from the left side of the browser window
   * @param {number} y - the offset from the top of the browser window
   * @param {string} title - the title to be displayed in the tooltip
   */
  display(data: TooltipContent, x: number, y: number, title: string): void {
    this.data = data;
    this.title = title;

    this.offsetX = `${x}px`;
    this.offsetY = `${y - 10}px`;

    this.hidden = false;
  }

  /**
   * Clears the content and coordinates for the tooltip as well as marking
   * the tooltip as hidden
   */
  clear(): void {
    this.data = null;
    this.title = null;

    this.offsetX = null;
    this.offsetY = null;

    this.hidden = true;
  }


  // Getter Methods

  /**
   * Returns the proper display attribute based on the tooltip's visibility flag
   */
  getDisplay(): string { return this.hidden ? 'none' : 'initial'; }

  /**
   * Returns the keys of the data (displayed as data types/titles for rows)
   */
  getDataRowKeys(): Array<string> { return Object.keys(this.data); }

}

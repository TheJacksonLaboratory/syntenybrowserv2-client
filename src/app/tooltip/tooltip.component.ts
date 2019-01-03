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

  constructor() { }

  display(data: TooltipContent, title: string = null) {
    this.data = data;
    this.title = title;
  }

  clear(): void {
    this.data = null;
    this.title = null;
  }

  getDataRowKeys(): Array<string> {
    return Object.keys(this.data);
  }

}

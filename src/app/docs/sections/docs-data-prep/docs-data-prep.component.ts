import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'data-prep',
  templateUrl: './docs-data-prep.component.html',
  styleUrls: ['./../../docs.component.scss'],
})
export class DocsDataPrepComponent {
  private dataUrl: string = environment.sourceData;
  // console.log(dataUrl);
}

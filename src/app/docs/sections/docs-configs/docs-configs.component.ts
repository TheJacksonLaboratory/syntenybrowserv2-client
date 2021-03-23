import { Component } from '@angular/core';
import { EMPTY_MOUSE, MOUSE } from '../../../synteny-browser/testing/constants/mock-species';

@Component({
  selector: 'docs-configs',
  templateUrl: './docs-configs.component.html',
  styleUrls: ['../../docs.component.scss'],
})
export class DocsConfigsComponent {
  formattedJSON(property: string = null): string {
    if (!property) {
      return JSON.stringify(EMPTY_MOUSE, null, '  ');
    }

    return JSON.stringify(MOUSE.organism[property], null, '  ');
  }
}

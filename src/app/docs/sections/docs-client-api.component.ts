import { Component } from '@angular/core';

@Component({
  selector: 'sb-docs-client-api',
  template: `
    <div class="content-container">
      <div class="content-area">
        <h2>Client API</h2>
      </div>
      <!-- nav element should be kept in 
      the parent component to preserve layout -->
      <nav class="sidenav">
        <sb-docs-menu></sb-docs-menu>
      </nav>
    </div>
  `,
  styleUrls: ['../docs.component.scss']
})

export class DocsClientAPIComponent {
	
}

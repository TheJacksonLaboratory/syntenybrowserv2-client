import { Component } from '@angular/core';

@Component({
  selector: 'sb-docs-features',
  template: `
    <div class="content-container">
      <div class="content-area">
        <h2>Browser Features</h2>
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

export class DocsFeaturesComponent {
	
}

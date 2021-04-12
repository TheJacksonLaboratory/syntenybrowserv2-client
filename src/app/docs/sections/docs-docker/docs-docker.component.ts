import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'docs-docker',
  templateUrl: './docs-docker.component.html',
  styleUrls: ['../../docs.component.scss'],
})
export class DocsDockerComponent {
  githubUI: string = environment.GitHubUI;
  githubAPI: string = environment.GitHubAPI;
}

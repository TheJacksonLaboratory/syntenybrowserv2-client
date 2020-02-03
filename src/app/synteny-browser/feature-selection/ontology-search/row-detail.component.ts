import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { OntologyTerm } from './ontology-search.component';

@Component({
  selector: 'row-detail',
  template: `
    <div class="datagrid-expandable-caret datagrid-fixed-column datagrid-cell"></div>
    <div [clrLoading]="loading">
      <ul *ngIf="metadata">
        <li *ngIf="metadata.namespace"><b>Namespace:</b> {{ metadata.namespace }}</li>
        <li *ngIf="metadata.def"><b>Definition:</b> {{ metadata.def }}</li>
        <li>
          <b>Descendant Terms:</b>
          {{ metadata.descendants.length ? metadata.descendants.length : 0 }}
          <ul *ngIf="metadata.descendants.length">
            <li *ngFor="let d of getDescendantsList()">
              <b>{{ d.id }}</b> {{ d.name }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
  `,
})
export class RowDetailComponent implements OnInit {
  // ID of the term to show information for
  @Input() termID: string;

  // indicates if the information is still loading
  loading: boolean;

  // the term metadata
  metadata: TermMetadata;

  constructor(private http: ApiService) {}

  ngOnInit(): void {
    this.http.getTermMetadata(this.termID).subscribe(metadata => {
      this.metadata = metadata;
      this.loading = false;
    });
  }

  /**
   * Returns the list of descendent term names and IDs
   */
  getDescendantsList(): DescendantTerm[] {
    const descendants = this.metadata.descendants;
    if (descendants.length > 10) {
      const descs = descendants.slice(0, 10);
      const numRemain = descendants.length - 10;

      descs.push({
        id: '',
        name: `and ${numRemain} other terms`,
      });

      return descs;
    }

    return descendants;
  }
}

export interface TermMetadata {
  namespace: string;
  def: string;
  descendants: OntologyTerm[];
}

export interface DescendantTerm {
  id: string;
  name: string;
}

import { Component, Input, OnInit } from '@angular/core';
import { Species } from '../classes/species';

import { Gene } from '../classes/gene';
import { Filter } from '../classes/filter';
import { ApiService } from '../services/api.service';
import { DownloadService } from '../services/download.service';
import { DataStorageService } from '../services/data-storage.service';
import { Option } from '../synteny-browser.component';

@Component({
  selector: 'block-view-filter',
  templateUrl: './block-view-filter.component.html',
  styleUrls: ['./block-view-filter.component.scss'],
})
export class BlockViewFilterComponent implements OnInit {
  // currently selected reference species
  @Input() refSpecies: Species;

  // currently selected comparison species
  @Input() compSpecies: Species;

  // currently active filters
  @Input() filters: Filter[];

  // all genes in the reference chromosome in the block view browser
  @Input() refGenes: Gene[];

  // all genes in the comparison regions in the block view browser
  @Input() compGenes: Gene[];

  // 'navigation' links to show in the sidebar of the dialog
  navigation: NavigationObject[] = [
    { name: 'edit filters', value: 'edit' },
    { name: 'preview filters', value: 'preview' },
    { name: 'filtering guide', value: 'guide' },
  ];

  // 'page' in the dialog navigation is currently visible
  activePage = 'edit';

  // current filter being edited
  currentFilter: Filter;

  // error message for current filter, if issues present
  filterErrorState: string = null;

  // concatenation of refGenes and compGenes for filters applied to both species
  allGenes: Gene[];

  // all genes affected by one or more filters
  filteredGenes: Gene[];

  constructor(
    private http: ApiService,
    public data: DataStorageService,
    private download: DownloadService,
  ) {}

  ngOnInit(): void {
    this.allGenes = this.refGenes.concat(...this.compGenes);

    if (this.filters.length) {
      this.applyFilters();
    }

    this.createNewEditableFilter();
  }

  /**
   * Creates a new default filter and sets it as the current filter
   */
  createNewEditableFilter(): void {
    // make sure that any prior filters are marked as not being edited
    this.filters.forEach(f => {
      f.editing = false;
    });

    // add the new filter
    this.filters.push(new Filter(this.refSpecies, this.compSpecies, this.filters.length));
    this.currentFilter = this.getCurrentFilter();
  }

  /**
   * Marks the specified filter as the current filter (editable) if the user is
   * in the edit page
   * @param {Filter} filter - the filter to mark as the current one to edit
   */
  editFilter(filter: Filter): void {
    if (this.activePage === 'edit') {
      this.filters = this.createdFilters;

      // make sure that all filters are marked as not being edited
      this.filters.forEach(f => {
        f.editing = false;
      });

      filter.editing = true;

      this.currentFilter = this.getCurrentFilter();

      this.reassignFilterIDs();
    }
  }

  /**
   * Marks the current filter as finished (aka "created") so that it is added to
   * the filter labels as long as there aren't any empty fields and creates a
   * new blank filter to edit
   */
  finishFilter(): void {
    // clear any current messages
    this.filterErrorState = '';

    if (!this.currentFilter.isComplete()) {
      this.filterErrorState = 'Please fill out all fields';
      return;
    }

    this.currentFilter.editing = false;
    this.currentFilter.created = true;

    // TODO: this is vastly inefficient and shouldn't be run for every filter
    //       every time a new one is finished
    this.applyFilters();

    // create a new filter using the current filter's advanced/simple setting
    this.createNewEditableFilter();
  }

  /**
   * Removes the specified filter from the list of filters
   * @param {Filter} filter - the title of the filter to remove
   */
  removeFilter(filter: Filter): void {
    this.filters = this.filters.filter(f => f.id !== filter.id);

    // update filter ids so they reflect their current index in the filter list
    this.reassignFilterIDs();

    // TODO: this is vastly inefficient and shouldn't be run for every filter
    //       every time a new one is finished
    this.applyFilters();
  }

  /**
   * Formats all of the selected filters' metadata as well as all of the
   * resulting genes in the table into a TSV-like file
   */
  downloadTable(): void {
    const ref = this.refSpecies.commonName;
    const comp = this.compSpecies.commonName;
    const rows = this.filteredGenes.map(g => g.getFilterMetadata(ref, comp));

    const lines = `[FILTER DATA]\nfilter type\tspecies\tcondition(s)\n${this.createdFilters
      .map(f => f.TSVRowForFilter)
      .join('\n')}\n\n[RESULTS DATA]\n${Object.keys(rows[0]).join('\t')}\n${rows
      .map(r => Object.values(r).join('\t'))
      .join('\n')}`;

    this.download.downloadText(lines, 'filter-results.txt');
  }

  /**
   * Sets the current filter's variables to filter by the specified attribute
   * @param {string} attribute - the attribute to filter features by
   */
  filterByAttribute(attribute: string): void {
    this.currentFilter.filterBy = attribute;
    this.currentFilter.value = '';
    this.currentFilter.qualifier = '';
  }

  /**
   * Sets the current filter's variables to filter by a specified ontology
   * @param {string} ontology - the ontology to filter features by
   */
  filterByOntology(ontology: string): void {
    this.currentFilter.filterBy = `ont-${ontology}`;
    this.currentFilter.qualifier = 'equal';
    this.currentFilter.value = null;
    this.currentFilter.setDropdownText();
    this.currentFilter.setLabel();
  }

  /**
   * Sets the current filter's type to be the specified feature type and
   * finishes the filter
   * @param {string} type - the feature type to filter features by
   */
  filterByType(type: string): void {
    this.currentFilter.filterBy = 'type';
    this.currentFilter.value = type;
    this.currentFilter.setDropdownText();
    this.currentFilter.setLabel();
  }

  /**
   * Sets the current filter's qualifier variables to consider user input
   * @param {string} qualifier - whether the user wants exact matches or a more
   *                             loose matching model
   */
  filterQualifier(qualifier: string): void {
    this.currentFilter.qualifier = qualifier;
    this.currentFilter.setDropdownText();
    this.currentFilter.setLabel();
  }

  /**
   * Emits a message if the term that's been selected is too broad to search
   */
  checkTermChildren(): void {
    this.filterErrorState = '';
    const filter = this.currentFilter;

    if (filter && filter.value) {
      const ontTerms = this.data.ontologyTerms[filter.ontology];
      const termIDs = ontTerms.map(t => t.id);
      const term = ontTerms[termIDs.indexOf(filter.value)];

      if (term.count && term.count > 500) {
        this.currentFilter.filterLabel = '';
        this.filterErrorState = 'Term too broad';
      } else {
        this.currentFilter.filterLabel = `${filter.title} ${filter.species}`;
      }
    }
  }

  /**
   * Returns the list of types available to filter by based on what the selected
   * species is for the current filter
   * @param {Filter} filter - the filter to get feature types for
   */
  getFeatureTypes(filter: Filter): string[] {
    const genes = this.getGenesForSpecies(filter);

    return Array.from(new Set(genes.map(g => g.type).filter(t => t))).sort();
  }

  /**
   * Returns the list of genes associated with the species identified by the
   * specified filter
   * @param {Filter} filter - the filter to get genes for
   */
  getGenesForSpecies(filter: Filter): Gene[] {
    if (filter.isRefFilter() && filter.isCompFilter()) {
      return this.allGenes;
    }
    if (filter.isRefFilter()) {
      return this.refGenes;
    }
    if (filter.isCompFilter()) {
      return this.compGenes;
    }

    return [];
  }

  /**
   * Returns the current filter being edited
   */
  getCurrentFilter(): Filter {
    return this.filters.find(f => f.editing);
  }

  /**
   * Returns the list of filters that have been completed/created
   */
  get createdFilters(): Filter[] {
    return this.filters.filter(f => f.created);
  }

  /**
   * Sets each of the current filter's ID to its index in the list
   */
  private reassignFilterIDs(): void {
    this.filters.forEach((f, i) => {
      f.id = i;
    });
  }

  /**
   * Returns an array of genes that are affected by the current selected filters
   * for the table
   */
  private applyFilters(): Gene[] {
    this.filteredGenes = [];
    this.refGenes.forEach(g => g.resetFilterStatus());
    this.compGenes.forEach(g => g.resetFilterStatus());

    if (this.createdFilters.length) {
      const filters = this.createdFilters;
      const hidingFilters = filters.filter(f => f.hides());
      const highlightFilters = filters.filter(f => !f.hides());

      // order matters here because if a gene satisfies an 'exclude' criteria AND
      // an 'include' criteria, the include should take precendence over the
      // exclude; in other words, if a gene satisfies AT LEAST ONE condition, it
      // should be filtered
      if (hidingFilters.length) {
        this.hideGenes(filters.filter(f => f.hides()));
      }

      if (highlightFilters.length) {
        this.filterGenes(filters.filter(f => !f.hides()));
      }

      return this.refGenes.concat(...this.compGenes).filter(g => g.filtered || g.hidden);
    }

    return [];
  }

  /**
   * Updates the list of genes from the specified list of genes that match at least
   * one of the specified filters
   * @param {Gene[]} genes - the list of genes to search for matches
   * @param {Filter[]} filters - the list of filters to check for matches
   * @param {Species} species - the species for the filter (if the filter uses
   *                            both, it'll use this method twice, so pass a
   *                            species each time to reduce the computational
   *                            weight)
   */
  private getMatches(genes: Gene[], filters: Filter[], species: Species): void {
    const ontologyFilters = filters.filter(f => f.filtersOnOntology());
    const attributeFilters = filters.filter(f => !f.filtersOnOntology());

    // check ontology filters first since they will take the longest
    if (ontologyFilters.length) {
      ontologyFilters.forEach(f => {
        this.http.getTermAssociations(species.getID(), f.value).subscribe(assoc => {
          const assocIDs = assoc.map(a => a.id);
          const associations = genes.filter(g => assocIDs.indexOf(g.id) >= 0);

          associations.forEach(a => {
            !f.hides() ? a.filter() : a.hide();

            // add the filter label of the filter it matches
            a.filters.push(f.filterLabel);

            // if an association is both filtered and hidden, default it to be filtered
            if (a.filtered && a.hidden) {
              a.show();
            }
          });

          // avoid adding duplicates
          const filteredGeneIDs = this.filteredGenes.map(g => g.id);
          const nonDupeAssoc = associations.filter(a => filteredGeneIDs.indexOf(a.id) < 0);
          this.filteredGenes.push(...nonDupeAssoc);
        });
      });
    }

    // check attribute filters
    if (attributeFilters.length) {
      const filteredGeneIDs = this.filteredGenes.map(g => g.id);
      const matches = genes.filter(g => {
        for (let i = 0; i < attributeFilters.length; i += 1) {
          if (attributeFilters[i].matchesFilter(g)) {
            !attributeFilters[i].hides() ? g.filter() : g.hide();

            // add the filter label of the filter it matches
            g.filters.push(attributeFilters[i].filterLabel);

            // if an association is both filtered and hidden, default it to be filtered
            if (g.filtered && g.hidden) {
              g.show();
            }

            // avoid adding duplicates
            return filteredGeneIDs.indexOf(g.id) < 0;
          }
        }

        return false;
      });

      this.filteredGenes.push(...matches);
    }
  }

  /**
   * Marks all reference and comparison genes that match at least one of the
   * specified filters as 'hidden'
   * @param {Filter[]} filters - list of filters to check genes against
   */
  private hideGenes(filters: Filter[]): void {
    const refFilters = filters.filter(f => f.isRefFilter());
    const compFilters = filters.filter(f => f.isCompFilter());

    if (refFilters.length) {
      this.getMatches(this.refGenes, refFilters, this.refSpecies);
    }

    if (compFilters.length) {
      this.getMatches(this.compGenes, compFilters, this.compSpecies);
    }
  }

  /**
   * Marks all reference and comparison genes that match at least one of the
   * specified filters as 'filtered'
   * @param {Filter[]} filters - list of conditions to check genes against
   */
  private filterGenes(filters: Filter[]): void {
    const refFilters = filters.filter(f => f.isRefFilter());
    const compFilters = filters.filter(f => f.isCompFilter());

    if (refFilters.length) {
      this.getMatches(this.refGenes, refFilters, this.refSpecies);
    }

    if (compFilters.length) {
      this.getMatches(this.compGenes, compFilters, this.compSpecies);
    }
  }
}

export type NavigationObject = Option;

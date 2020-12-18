import { SearchType, Species } from './species';
import { Gene } from './gene';

export class Filter {
  // data for species a filter could apply to
  allSpecies: any;

  // filter mode ('highlight' or 'hide')
  mode = 'highlight';

  // currently selected reference species
  refSpecies: Species;

  // currently selected comparison species
  compSpecies: Species;

  // attribute to filter features by (ontology term, symbol, id, type, etc.)
  filterBy = '';

  // qualifier to change how matches are found (equal, not equal, like, not like)
  qualifier = 'equal';

  // value to match features against when searching utilizing user input
  value = '';

  // ID for the filter to identify it from other possible filters
  id: number;

  // title that is generated from using the simple creation interface
  filterByButtonText: string;

  // value to display in the tag to identify the filter to the user
  filterLabel: string;

  // indicates if the filter has been created and is displayed in the list of filters
  created = false;

  // indicates if the filter is currently being edited
  editing = true;

  constructor(ref: Species, comp: Species, id: number) {
    this.refSpecies = ref;
    this.compSpecies = comp;
    this.id = id;
    this.allSpecies = {
      ref: { name: this.refSpecies.commonName, value: 'ref', selected: true },
      comp: { name: this.compSpecies.commonName, value: 'comp', selected: true },
    };
  }

  /**
   * Marks the appropriate species as (de)selected
   * @param {string} speciesKey - the value associated with the selected species
   */
  selectSpecies(speciesKey: string): void {
    if (speciesKey.includes('either')) {
      this.ref.selected = true;
      this.comp.selected = true;
    } else if (speciesKey.includes(this.ref.name)) {
      this.ref.selected = true;
      this.comp.selected = false;
    } else {
      this.comp.selected = true;
      this.ref.selected = false;
    }
  }

  /**
   * Sets the text that should appear within a label component, including the
   * filter mode (hiding/highlighting), the conditions and affected species
   */
  setLabel(): void {
    this.filterLabel = `${this.title} in ${this.species}`;
    this.setSimpleTitle();
  }

  /**
   * Sets the label for the simple filter menu button
   */
  setSimpleTitle(): void {
    if (this.filtersOnType()) {
      this.filterByButtonText = `that are ${this.value}s in ${this.species}`;
    } else {
      const filterBy = this.filtersOnOntology() ? `${this.ontology} term` : this.filterBy;
      const qual = this.qualifier === 'like' ? 'like' : '';
      this.filterByButtonText = `in ${this.species} by ${filterBy} ${qual}`;
    }
  }

  /**
   * Returns the list of ontologies that are available to choose from for each
   * condition given the selected species for the filter
   */
  get ontologies(): SearchType[] {
    if (this.isRefFilter() && this.isCompFilter()) {
      return this.refSpecies.onts.filter(
        ro => this.compSpecies.onts.map(co => co.value).indexOf(ro.value) >= 0,
      );
    }
    if (this.isRefFilter()) {
      return this.refSpecies.onts;
    }
    return this.compSpecies.onts;
  }

  /**
   * Returns the common names of the species that the filter will affect
   */
  get species(): string {
    const ref = this.isRefFilter();
    const comp = this.isCompFilter();

    if (ref && comp) {
      return 'either species';
    }
    if (ref && !comp) {
      return `${this.ref.name} only`;
    }

    if (!ref && comp) {
      return `${this.comp.name} only`;
    }

    return null;
  }

  get comp(): any {
    return this.allSpecies.comp;
  }

  get ref(): any {
    return this.allSpecies.ref;
  }

  get inputNeeded(): boolean {
    return this.filterBy && !this.filtersOnType();
  }

  /**
   * Returns a list of option titles for species selection in simple filter mode
   */
  get speciesOptions(): any[] {
    return [
      'either species',
      `${this.refSpecies.commonName} only`,
      `${this.compSpecies.commonName} only`,
    ];
  }

  /**
   * Returns the title of the filter condition
   */
  get title(): string {
    if (this.filterBy === 'chr') {
      return `Chr${this.value}`;
    }
    if (this.filtersOnType()) {
      return `${this.value}s`;
    }
    if (this.filtersOnOntology()) {
      return this.value;
    }

    let qual;
    if (this.qualifier.includes('not')) {
      qual = this.qualifier.includes('equal') ? '&ne' : 'not like';
    } else {
      qual = this.qualifier.includes('equal') ? '=' : 'like';
    }

    return `${this.filterBy} ${qual} ${this.value}`;
  }

  /**
   * Returns the stringified, tab-separated details about the filter and its
   * conditions for the purposes of being included in the file representing the
   * table
   */
  get TSVRowForFilter(): string {
    return [this.mode, this.species, this.title].join('\t');
  }

  /**
   * Returns the selected ontology abbreviation from the filter by its value
   */
  get ontology(): string {
    return this.filterBy.replace('ont-', '');
  }

  /**
   * Returns true if the filter is set to hide matching features
   */
  hides(): boolean {
    return this.mode === 'hide';
  }

  /**
   * Returns true if the filter is finding matches based on type
   */
  filtersOnType(): boolean {
    return this.filterBy === 'type';
  }

  /**
   * Returns true if the filter is finding matches based on an ontology term
   */
  filtersOnOntology(): boolean {
    return this.filterBy.includes('ont-');
  }

  /**
   * Returns true if the specified gene matches ALL of the filter's conditions
   * @param {Gene} gene - the gene to check against all conditions
   */
  matchesFilter(gene: Gene): boolean {
    const geneValue = gene[this.filterBy].toLowerCase();
    const condValue = this.value.toLowerCase();

    if (this.qualifier.includes('not')) {
      return this.qualifier.includes('equal')
        ? geneValue !== condValue
        : !geneValue.includes(condValue);
    }
    return this.qualifier.includes('equal')
      ? geneValue === condValue
      : geneValue.includes(condValue);
  }

  /**
   * Returns true if all fields are complete/have values
   */
  isComplete(): boolean {
    return !!(this.filterBy && this.qualifier && this.value);
  }

  /**
   * Returns true if the filter applies to the reference features; the
   * boolean condition takes into consideration if the species selection is both
   * species
   */
  isRefFilter(): boolean {
    return this.ref.selected;
  }

  /**
   * Returns true if the filter applies to the comparison features; the
   * boolean condition takes into consideration if the species selection is both
   * species
   */
  isCompFilter(): boolean {
    return this.comp.selected;
  }
}

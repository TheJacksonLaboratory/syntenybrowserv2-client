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
  qualifier;

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
   * Sets the default text that appears within a label with the condition and
   * affected species
   */
  setLabel(): void {
    this.filterLabel = `${this.title} ${this.species}`;
  }

  /**
   * Sets the label for the filter menu button
   */
  setDropdownText(): void {
    if (this.filtersOnType()) {
      this.filterByButtonText = `that are ${this.value}s ${this.species}`;
    } else {
      const filterBy = this.filtersOnOntology() ? `${this.ontology} term` : this.filterBy;
      const qual = this.qualifier === 'like' ? 'like' : '';
      this.filterByButtonText = `${this.species} by ${filterBy} ${qual}`;
    }
  }

  /**
   * Returns the list of ontologies that are available to choose from given the
   * selected species for the filter
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
      return '';
    }
    if (ref && !comp) {
      return `in ${this.ref.name}`;
    }

    if (!ref && comp) {
      return `in ${this.comp.name}`;
    }

    return null;
  }

  /**
   * Returns the info (name, value, selection status) for the comparison species
   */
  get comp(): any {
    return this.allSpecies.comp;
  }

  /**
   * Returns the info (name, value, selection status) for the reference species
   */
  get ref(): any {
    return this.allSpecies.ref;
  }

  /**
   * Returns true if the filter needs an input (if user wants to filter by symbol
   * or ID)
   */
  get inputNeeded(): boolean {
    return !!this.filterBy && !(this.filtersOnType() || this.filtersOnOntology());
  }

  /**
   * Returns a list of titles for species selection in the dropdown menu
   */
  get speciesOptions(): any[] {
    return [
      'either species',
      `${this.refSpecies.commonName} only`,
      `${this.compSpecies.commonName} only`,
    ];
  }

  /**
   * Returns a short title for the filter's condition
   */
  get title(): string {
    if (this.filtersOnType()) {
      return `${this.value}s`;
    }
    if (this.filtersOnOntology()) {
      return this.value;
    }

    return `"${this.value}"`;
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

    return this.qualifier.includes('equal')
      ? geneValue === condValue
      : geneValue.includes(condValue);
  }

  /**
   * Returns true if all fields are complete/have values
   */
  isComplete(): boolean {
    if (this.filtersOnType()) {
      return !!this.value;
    }
    if (this.filterBy) {
      return !!(this.qualifier && this.value);
    }

    return false;
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

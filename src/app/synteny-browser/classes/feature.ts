export class Feature {
  id: string;
  symbol: string;
  chr: string;
  start: number;
  end: number;
  type: string;
  gene: boolean;

  term: string;
  termID: string;

  selected: boolean = false;

  constructor(feature: any, assocMode = false) {
    this.id = feature.id;
    this.symbol = feature.symbol;
    // TODO: this shouldn't be the determining factor for if it is a gene but it
    //  is until genes get a type attribute from new API
    this.gene = !feature.type;
    this.type = this.gene ? '' : feature.type; // TODO: fix this as well
    this.chr = feature.chr;
    this.start = feature.start;
    this.end = feature.end;

    if(assocMode) {
      this.term = feature.term_name;
      this.termID = feature.term_id;
    }
  }


  //Operational Methods

  /**
   * Sets the selected flag to false (deselects the current feature)
   */
  deselect(): void { this.selected = false; }

  /**
   * Sets the selected flag to true (selects the current feature)
   */
  select(): void { this.selected = true; }


  // Condition Checks

  /**
   * Returns true/false if the feature's symbol *contains* the specified
   * search string
   * @param {string} search - the search string
   */
  matchesSearch(search: string): boolean {
    return this.symbol.toLowerCase().includes(search.toLowerCase()) ||
           this.id.toLowerCase().includes(search.toLowerCase()) ||
           this.type.toLowerCase().includes(search.toLowerCase());
  }

  /**
   * Returns true/false if the feature's symbol *is the same as* the
   * specified symbol
   * @param {string} symbol - the symbol to compare to
   */
  is(symbol: string): boolean {
    return this.symbol.toLowerCase() === symbol.toLowerCase();
  }
}

import { Option } from '../synteny-browser.component';

export class Species {
  // taxon ID for the species
  taxonID: number;

  // latin species name
  name: string;

  // two-letter value abbreviating the latin species name
  abbrev: string;

  // non-latin English species name
  commonName: string;

  // dictionary of chromosomes in the species' genome
  genome: any;

  // list of available ontologies to search for features
  onts: SearchType[];

  // list of available ways to search for features
  searchTypes: SearchType[];

  // indicates if the species has QTLs stored in the database to query
  hasQTLs: boolean;

  // url data for features where external links can be generated for more information
  resources: ExternalResource[];

  /**
   * Creates a Species object
   * @param {any} species - the raw species object from the API
   */
  constructor(species: any) {
    this.name = species.name;
    this.abbrev = species.name
      .split(' ')
      .map(w => w[0].toUpperCase())
      .join('');
    this.commonName = species.alias;
    this.taxonID = species.id;
    this.resources = species.resources;
    this.genome = species.genome;
    this.hasQTLs = species.qtls;
    this.searchTypes = species.searches;
    this.onts = species.ontologies;
  }

  /**
   * Returns the taxon ID in string form
   */
  getID(): string {
    return this.taxonID.toString();
  }

  /**
   * Returns the chromosome values in the genome
   */
  getChromosomes(): string[] {
    return Object.keys(this.genome);
  }

  /**
   * Returns the number of chromosomes in the genome
   */
  getNumChrs(): number {
    return this.getChromosomes().length;
  }
}

export type SearchType = Option;

export interface ExternalResource {
  name: string;
  url: string;
}

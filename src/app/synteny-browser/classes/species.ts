import { ExternalResource, SearchType } from './interfaces';

export class Species {
  taxonID: number;
  name: string;
  commonName: string;
  genome: any;
  onts: SearchType[];
  searchTypes: SearchType[];
  hasQTLs: boolean;
  resources: ExternalResource[];

  /**
   * Creates a Species object
   * @param {any} species - the raw species object from the API
   */
  constructor(species: any) {
    this.name = species.name;
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
}

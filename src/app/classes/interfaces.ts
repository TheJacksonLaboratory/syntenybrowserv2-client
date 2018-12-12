export interface Response {
  species?: Array<RawSpecies>;
  genes?: Array<any>;
  blocks?: Array<SyntenyBlock>;
  qtls?: Array<QTLMetadata>;
  ont_genes?: Array<OntologyGeneMetadata>;

}

export interface RawSpecies {
  ref_taxonid: number
}

export interface Chromosome {
  chr: string;
  size: number;
}

export interface SearchType {
  name: string;
  value: string;
  search_example: string;
  search_type: string;
}

export interface ExternalResource {
  name: string;
  url: string;
}

export interface Metadata {
  term_id?: string;
  term_name?: string;
  qtl_id?: string;
  qtl_symbol?: string;
  gene_id?: string;
  gene_symbol?: string;
  gene_type?: string;
  chr: string;
  strand?: string;
  start: number;
  end: number;
}

export interface OntologyGeneMetadata extends Metadata {
  term_id: string;
  term_name: string;
  gene_id: string;
  gene_symbol: string;
  gene_type: string;
  chr: string;
  strand: string;
  start: number;
  end: number;
}

export interface QTLMetadata extends Metadata {
  qtl_id: string;
  qtl_symbol: string;
  chr: string;
  start: number;
  end: number;
}

export interface SyntenyBlock {
  comp_chr: string;
  comp_start?: number;
  comp_end?: number;
  ref_chr: string;
  ref_start: number;
  ref_end: number;
  id?: string;
  orientation_matches?: boolean;
  true_orientation?: ComparisonBlockCoordinates;
  match_orientation?: ComparisonBlockCoordinates;
}

export interface CartesianCoordinate {
  x: number;
  y: number;
}

export interface SelectedFeatures {
  chr: string;
  features: Array<Metadata>;
}

export interface BrowserInterval {
  start: number;
  end: number;
  width: number;
  compEnd?: ComparisonMapping;
  compStart?: ComparisonMapping;
}

export interface ComparisonMapping {
  chr: string;
  loc: number;
}

export interface ComparisonBlockCoordinates {
  comp_start: number;
  comp_end: number;
}

export interface GeneMetadata extends Metadata {
  gene_id: string;
  gene_symbol: string;
  gene_type: string;
  chr: string;
  strand: string;
  start: number;
  end: number;
}

export interface ComparisonScaling {
  match_orientation: any;
  true_orientation: any;
}

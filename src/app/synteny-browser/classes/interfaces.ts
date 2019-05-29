import { Feature } from './feature';
import { SyntenyBlock } from './synteny-block';
import {ClrLoadingState} from '@clr/angular';

export interface Response {
  species?: Array<RawSpecies>;
  genes?: Array<any>;
  blocks?: Array<SyntenyBlock>;
  qtls?: Array<QTLMetadata>;
  ont_genes?: Array<OntologyGeneMetadata>;
  terms?: Array<OntologyTerm>;
}

export interface OntologyTerm {
  id: string;
  name: string;
  descendant_count?: number;
  selecting?: ClrLoadingState;
}

export interface RawSpecies {
  ref_taxonid: number
}

export interface Chromosome {
  chr: string;
  size: number;
}
export interface Option {
  name: string;
  value: string;
}

export interface BlockViewBrowserOptions {
  symbols: boolean;
  anchors: boolean;
  trueOrientation: boolean;
}

export interface SearchType extends Option { }

export interface NavigationObject extends Option { }

export interface FilterCondition {
  filterBy: string;
  attribute: string;
  type: string;
  qualifier: string;
  value: string;
  removable: boolean;
  id: number;
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

export interface CartesianCoordinate {
  x: number;
  y: number;
}

export interface SelectedFeatures {
  chr: string;
  features: Array<Feature>;
}

export interface ComparisonBlockCoordinates {
  compStart: number;
  compEnd: number;
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
  match: object;
  true: object;
}

export interface Exon {
  start: number;
  end: number;
}

export interface TooltipContent extends Object {}

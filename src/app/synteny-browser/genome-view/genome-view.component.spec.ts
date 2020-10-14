import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GenomeViewComponent } from './genome-view.component';
import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { MockApiService } from '../testing/mock-api.service';
import { DataStorageService } from '../services/data-storage.service';
import { Species } from '../classes/species';
import { HUMAN, MOUSE } from '../testing/constants/mock-species';
import { COLOR_MAP } from '../testing/constants/color-map';
import { Feature } from '../classes/feature';
import { SyntenyBlock } from '../classes/synteny-block';
import { SELECTED_FEATURE_MULTI_BLOCK, SELECTED_FEATURES_NO_SYNTENY, SELECTED_QTL_FEATURES } from '../testing/constants/mock-features';

export class MockDataStorageService {
  refSpecies = new Species(MOUSE.organism);
  compSpecies = new Species(HUMAN.organism);
  genomeColorMap = COLOR_MAP;
  genomeData;

  getFeatureBlocks(features: Feature[]): SyntenyBlock[] {
    return [].concat(...features.map(f => this.getBlocksForFeature(f)));
  }

  isFeatureNonSyntenic(feature: Feature): boolean {
    return !this.getBlocksForFeature(feature).length;
  }

  getChrBlocks(chr: string, blockList: SyntenyBlock[] = this.genomeData): SyntenyBlock[] {
    return blockList.filter(b => b.matchesRefChr(chr));
  }

  private getBlocksForFeature(feature: Feature): SyntenyBlock[] {
    return this.genomeData.filter(b => b.isAFeatureBlock(feature));
  }
}

describe('GenomeViewComponent', () => {
  let component: GenomeViewComponent;
  let fixture: ComponentFixture<GenomeViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ClarityModule, FormsModule],
      declarations: [GenomeViewComponent],
      providers: [
        { provide: ApiService, useClass: MockApiService },
        { provide: DataStorageService, useClass: MockDataStorageService }
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenomeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.reset();
  })

  it('should create with empty data structures by default', () => {
    expect(component).toBeTruthy();
    expect(component.ref).toBeFalsy();
    expect(component.comp).toBeFalsy();
    expect(component.refGMap).toBeFalsy();
    expect(component.compGMap).toBeFalsy();

    expect(component.features).toBeFalsy();
    expect(component.featuresNoBlocks).toBeFalsy();
  });

  it('should generate dimensions that make the plot as large as possible', () => {
    expect(component.width).toBe(500);
    expect(component.height).toBe(510);
    expect(component.bandThickness).toBe(21);
    expect(component.refRadii.ringInner).toBe(188);
    expect(component.refRadii.ringOuter).toBe(209);
    expect(component.refRadii.labels).toBe(219);
    expect(component.featureRadii.ringOuter).toBe(188);
    expect(component.featureRadii.ringInner).toBe(172.25);
    expect(component.compRadii.ringInner).toBe(125);
    expect(component.compRadii.ringOuter).toBe(146);
    expect(component.compRadii.labels).toBe(156);
  });

  it('renders', () => {
    component.render();

    expect(component.ref.getID()).toBe('10090');
    expect(component.comp.getID()).toBe('9606');
    expect(component.refGMap).toBeTruthy();
    expect(component.compGMap).toBeTruthy();
    expect(component.ref.getChromosomes().length).toBe(21);
    expect(component.comp.getChromosomes().length).toBe(24);
    expect(component.getGenomeBlocks().length).toBeGreaterThan(0);
    expect(component.getChrsWithFeatures().length).toBe(0);
    expect(component.features.length).toBe(0);
    expect(component.featuresNoBlocks.length).toBe(0);
  });

  it('renders with selected features', () => {
    component.render();
    component.updateFeatures(SELECTED_FEATURES_NO_SYNTENY);
    expect(component.getChrsWithFeatures().length).toBe(1);
    expect(component.features.length).toBe(3);
  });

  it('changes the plot dimensions to acccommodate legend', () => {
    component.render();
    component.updateFeatures(SELECTED_FEATURE_MULTI_BLOCK);

    expect(component.bandThickness).toBe(18);
    expect(component.refRadii.ringInner).toBe(155);
    expect(component.refRadii.ringOuter).toBe(173);
    expect(component.refRadii.labels).toBe(183);
    expect(component.featureRadii.ringOuter).toBe(155);
    expect(component.featureRadii.ringInner).toBe(141.5);
    expect(component.compRadii.ringInner).toBe(100);
    expect(component.compRadii.ringOuter).toBe(118);
    expect(component.compRadii.labels).toBe(128);
  });

  it('correctly identifies non-syntenic gene features', () => {
    component.render();
    component.updateFeatures(SELECTED_FEATURES_NO_SYNTENY);

    expect(component.getChrsWithFeatures().length).toBe(1);
    expect(component.features.length).toBe(3);
    expect(component.featuresNoBlocks.length).toBe(3);
    expect(component.featureBlocks.length).toBe(0);
  });

  it('correctly identifies all blocks for gene feature that spans more than one', () => {
    component.render();
    component.updateFeatures(SELECTED_FEATURE_MULTI_BLOCK);

    expect(component.getChrsWithFeatures().length).toBe(1);
    expect(component.features.length).toBe(1);
    expect(component.featuresNoBlocks.length).toBe(0);
    expect(component.featureBlocks.length).toBe(3);
  });

  it('correctly identifies all blocks for QTL features', () => {
    component.render();
    component.updateFeatures(SELECTED_QTL_FEATURES);

    expect(component.getChrsWithFeatures().length).toBe(1);
    expect(component.features.length).toBe(2);
    expect(component.featuresNoBlocks.length).toBe(0);
    expect(component.featureBlocks.length).toBe(11);
  });

  it('clears gene features if passed an empty list', () => {
    component.render();
    component.updateFeatures(SELECTED_FEATURES_NO_SYNTENY);

    expect(component.getChrsWithFeatures().length).toBe(1);
    expect(component.features.length).toBe(3);
    expect(component.featuresNoBlocks.length).toBe(3);
    expect(component.featureBlocks.length).toBe(0);

    component.updateFeatures([]);
    expect(component.getChrsWithFeatures().length).toBe(0);
    expect(component.features.length).toBe(0);
    expect(component.featuresNoBlocks.length).toBe(0);
    expect(component.featureBlocks.length).toBe(0);
  });

  it('renders a full chord mapping when a chromosome is clicked', () => {
    component.render();
    expect(component.refGMap.sizes.length).toBe(21)
    expect(component.compGMap.sizes.length).toBe(24);

    component.renderChordMapForChr("1");

    expect(component.refChr.chr).toBe('ref1');
    expect(component.refChr.size).toBe(195471971);
    expect(component.refChr.blocks.length).toBe(39);
    expect(component.refGMap.sizes.length).toBe(21)
    expect(component.compGMap.sizes.length).toBe(25);
  });

  it('renders a select chord mapping when a chromosome is selected with features', () => {
    component.render();
    component.updateFeatures(SELECTED_QTL_FEATURES);
    component.renderChordMapForChr("1");

    expect(component.refChr.chr).toBe('ref1');
    expect(component.refChr.size).toBe(195471971);
    expect(component.refChr.blocks.length).toBe(11);
  });

  it('renders a full chord mapping if all selected features in chromosome are non-syntenic', () => {
    component.render();
    component.updateFeatures(SELECTED_FEATURES_NO_SYNTENY);
    component.renderChordMapForChr("1");

    expect(component.refChr.blocks.length).toBe(39);
  });
});

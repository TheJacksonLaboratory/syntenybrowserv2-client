import { async, ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';

import { BlockViewBrowserComponent } from './block-view-browser.component';
import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { QuickNavigationComponent } from './quick-navigation/quick-navigation.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ApiService } from '../services/api.service';
import { MockApiService } from '../testing/mock-api.service';
import { DataStorageService } from '../services/data-storage.service';
import { HUMAN, MOUSE } from '../testing/constants/mock-species';
import { Species } from '../classes/species';
import { MOUSE_TO_HUMAN_SYNTENY } from '../testing/constants/genome-synteny';
import { COLOR_MAP } from '../testing/constants/color-map';
import { SyntenyBlock } from '../classes/synteny-block';
import { SELECTED_QTL_FEATURES, SELECTED_SYNTENIC_FEATURES } from '../testing/constants/mock-features';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

class MockDataStorageService {
  refSpecies = new Species(MOUSE.organism);
  compSpecies = new Species(HUMAN.organism);
  features = {chr: '1', features: []};
  genomeData = MOUSE_TO_HUMAN_SYNTENY.map(b => new SyntenyBlock(b));
  genomeColorMap = COLOR_MAP;
}

describe('BlockViewBrowserComponent', () => {
  let component: BlockViewBrowserComponent;
  let fixture: ComponentFixture<BlockViewBrowserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ClarityModule, FormsModule, NgSelectModule, BrowserAnimationsModule],
      declarations: [BlockViewBrowserComponent, QuickNavigationComponent],
      providers: [
        { provide: ApiService, useClass: MockApiService },
        { provide: DataStorageService, useClass: MockDataStorageService },
        { provide: ComponentFixtureAutoDetect, useValue: true }
      ],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(BlockViewBrowserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
  }));

  it('should create with default values', () => {
    expect(component).toBeTruthy();
    expect(component.ref).toBeFalsy();
    expect(component.comp).toBeFalsy();
    expect(component.refChr).toBeFalsy();
    expect(component.refInterval).toBe('');
    expect(component.selectedRefGenes.length).toBe(0);
    expect(component.selectedCompGenes.length).toBe(0);
    expect(component.width).toBe(1200);
    expect(component.height).toBe(430);
    expect(component.minimumIntervalSize).toBe(3000);
  });

  it('should have default settings and comparison scale lookup', () => {
    expect(component.options.symbols).toBe(false);
    expect(component.options.anchors).toBe(false);
    expect(component.options.trueOrientation).toBe(false);
    expect(component.options.GWAS).toBe(true);
    expect(component.staticCompBPToPixels.match).toEqual({});
    expect(component.staticCompBPToPixels.true).toEqual({});
  });

  it('gets the correct species, reference chr and scales when rendering', () => {
    component.render();

    expect(component.ref.getID()).toBe('10090');
    expect(component.comp.getID()).toBe('9606');
    expect(component.refChr).toBe('1');
    expect(component.cytoBands.length).toBe(33);
    expect(component.refBPToPixels(0)).toBe(0);
    expect(component.refBPToPixels(0)).toBe(0);
    expect(component.refGMap).toBeTruthy();
  });

  it('defines the required tooltips', () => {
    component.render();

    expect(component.featureTip).toBeTruthy();
    expect(component.blockTip).toBeTruthy();
  });

  it('gathers syntenic blocks', () => {
    component.render();

    expect(Object.keys(component.blockLookup).length).toBe(component.blocks.length);
    expect(Object.keys(component.staticCompBPToPixels.match).length)
      .toBe(component.blocks.length);
    expect(Object.keys(component.staticCompBPToPixels.true).length)
      .toBe(component.blocks.length);
    expect(component.legend.activeChrs.length).toBe(39);
  });

  it('gathers GWAS data', () => {
    component.render();

    expect(component.humanGWAS.length).toBe(42);
    expect(component.humanGWAS[0].location).toBe(207478831);
    expect(component.humanGWAS[0].hits.length).toBe(1);
    expect(component.humanGWAS[16].hits.length).toBe(3);
  });

  it('gathers genes and homologs', () => {
    component.render();

    expect(component.compGenes.length).toBe(5);
    expect(component.refGenes.length).toBe(5);
    expect(component.selectedRefGenes.length).toBe(0);
    expect(component.selectedCompGenes.length).toBe(0);
    expect(component.featuresAreSelected()).toBe(false);
    expect(component.interval.refStart).toBe(0);
    expect(component.interval.refEnd).toBe(195471971);
    expect(component.interval.trueOrientation).toBe(false);
  });

  it('can jump to an interval', () => {
    component.render();
    component.jumpToInterval([103106575, 113142630]);

    expect(component.interval.refStart).toBe(103106575);
    expect(component.interval.refEnd).toBe(113142630);
  });

  it('can pan left normally', () => {
    component.render();

    // we're using this function to move the view instead of exposing the private method
    component.jumpToInterval([103106575, 113142630]);
    component.panLeft();

    expect(component.interval.refStart).toBe(101601167);
    expect(component.interval.refEnd).toBe(111637222);
  });

  it('will not surpass 0 when panning left', () => {
    component.render();
    component.jumpToInterval([1726633, 20935426]);
    component.panLeft();

    expect(component.interval.refStart).toBe(0);
    expect(component.interval.refEnd).toBe(19208793);

    // try again and expect that the interval hasn't changed
    component.panLeft();

    expect(component.interval.refStart).toBe(0);
    expect(component.interval.refEnd).toBe(19208793);
  });

  it('can pan right normally', () => {
    component.render();
    component.jumpToInterval([103106575, 113142630]);
    component.panRight();

    expect(component.interval.refStart).toBe(104611983);
    expect(component.interval.refEnd).toBe(114648038);
  });

  it('will not surpass reference chromosome max when panning right', () => {
    component.render();
    component.jumpToInterval([173742439, 192951232]);
    component.panRight();

    expect(component.interval.refStart).toBe(176263178);
    expect(component.interval.refEnd).toBe(195471971);

    component.panRight();

    expect(component.interval.refStart).toBe(176263178);
    expect(component.interval.refEnd).toBe(195471971);
  });

  it('can zoom out normally', () => {
    component.render();
    component.jumpToInterval([103106575, 113142630]);
    component.zoomOut();

    expect(component.interval.refStart).toBe(101601167);
    expect(component.interval.refEnd).toBe(114648038);
  });

  it('will not zoom out past the reference chromosome extents', () => {
    component.render();
    component.jumpToInterval([1402889, 192989936]);
    component.zoomOut();

    expect(component.interval.refStart).toBe(0);
    expect(component.interval.refEnd).toBe(195471971);

    component.zoomOut();

    expect(component.interval.refStart).toBe(0);
    expect(component.interval.refEnd).toBe(195471971);
  });

  it('can zoom in normally', () => {
    component.render();
    component.jumpToInterval([103106575, 113142630]);
    component.zoomIn();

    expect(component.interval.refStart).toBe(104611983);
    expect(component.interval.refEnd).toBe(111637222);
  });

  it('will not zoom in past the minimum interval size', () => {
    component.render();
    component.jumpToInterval([73891948, 73894848]);
    component.zoomIn();

    expect(component.interval.refStart).toBe(73891898);
    expect(component.interval.refEnd).toBe(73894898);

    component.zoomIn();

    expect(component.interval.refStart).toBe(73891898);
    expect(component.interval.refEnd).toBe(73894898);
  });

  it('will not render "jump to feature" menu button if no features selected', () => {
    component.render();
    fixture.detectChanges();

    expect(component.featuresAreSelected()).toBe(false);
    expect(fixture.nativeElement.querySelector('.group-dropdown')).toBeFalsy();
  });

  it('should show selected genes', () => {
    component.data.features.features = SELECTED_SYNTENIC_FEATURES;
    component.render();

    expect(component.selectedRefGenes.length).toBe(3);
    expect(component.selectedCompGenes.length).toBe(4);
    expect(component.selectedQTLs.length).toBe(0);
    expect(component.featuresAreSelected()).toBe(true);

    expect(component.interval.refStart).toBe(180586266);
    expect(component.interval.refEnd).toBe(185721522);
  });

  it('should show selected QTLs', () => {
    component.data.features.features = SELECTED_QTL_FEATURES;
    component.render();

    expect(component.selectedRefGenes.length).toBe(0);
    expect(component.selectedCompGenes.length).toBe(0);
    expect(component.selectedQTLs.length).toBe(2);
    expect(component.featuresAreSelected()).toBe(true);

    expect(component.interval.refStart).toBe(0);
    expect(component.interval.refEnd).toBe(195471971);
  });

  it('should be able to show selected genes and QTLs', () => {
    component.data.features.features = [...SELECTED_SYNTENIC_FEATURES, ...SELECTED_QTL_FEATURES];
    component.render();

    expect(component.selectedRefGenes.length).toBe(3);
    expect(component.selectedCompGenes.length).toBe(4);
    expect(component.selectedQTLs.length).toBe(2);

    expect(component.interval.refStart).toBe(180586266);
    expect(component.interval.refEnd).toBe(185721522);
  });

  it('should show "jump to feature" menu for selected genes', () => {
    component.data.features.features = SELECTED_SYNTENIC_FEATURES;
    component.render();
    fixture.detectChanges();

    const dropdownBtn = fixture.debugElement.query(By.css('.group-dropdown'));
    dropdownBtn.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.dropdown-header').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.dropdown-header').textContent).toBe('Genes');
    expect(fixture.nativeElement.querySelectorAll('button.dropdown-item').length).toBe(3);
    expect(fixture.nativeElement.querySelector('.dropdown-divider')).toBeFalsy();
  });

  it('should show "jump to feature" menu for selected QTLs', () => {
    component.data.features.features = SELECTED_QTL_FEATURES;
    component.render();
    fixture.detectChanges();

    const dropdownBtn = fixture.debugElement.query(By.css('.group-dropdown'));
    dropdownBtn.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.dropdown-header').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.dropdown-header').textContent).toBe('QTLs');
    expect(fixture.nativeElement.querySelectorAll('button.dropdown-item').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.dropdown-divider')).toBeFalsy();

  });

  it('should show "jump to feature" menu for selected genes and QTLs', () => {
    component.data.features.features = [...SELECTED_SYNTENIC_FEATURES, ...SELECTED_QTL_FEATURES];
    component.render();
    fixture.detectChanges();

    const dropdownBtn = fixture.debugElement.query(By.css('.group-dropdown'));
    dropdownBtn.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.dropdown-header').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.dropdown-header')[0].textContent).toBe('Genes');
    expect(fixture.nativeElement.querySelectorAll('.dropdown-header')[1].textContent).toBe('QTLs');
    expect(fixture.nativeElement.querySelectorAll('button.dropdown-item').length).toBe(5);
    expect(fixture.nativeElement.querySelector('.dropdown-divider')).toBeTruthy();
  });

  it('jumps to a gene', () => {
    component.data.features.features = SELECTED_SYNTENIC_FEATURES;
    component.render();
    component.jumpToFeature(SELECTED_SYNTENIC_FEATURES[1]);

    expect(component.interval.refStart).toBe(8798107);
    expect(component.interval.refEnd).toBe(10900845);
  });

  it('jumps to a QTL', () => {
    component.data.features.features = SELECTED_QTL_FEATURES;
    component.render();
    component.jumpToFeature(SELECTED_QTL_FEATURES[1]);

    expect(component.interval.refStart).toBe(61907596);
    expect(component.interval.refEnd).toBe(121601949);
  });

  it('downloads', () => {
    const spyOnSetObjectAttributes = spyOn(component, 'setObjectAttributes');
    const spyOnDownloader = spyOn(component.downloader, 'downloadSVG');
    component.render();
    fixture.detectChanges();

    // expect all of the default including that the modal won't be visible
    expect(fixture.nativeElement.querySelector('.modal')).toBeFalsy();
    expect(component.filenameModalOpen).toBe(false);
    expect(component.downloadFilename).toBe('');

    // click on the icon button to download
    const downloadIconBtn = fixture.debugElement.query(By.css('#block-view-download'));
    downloadIconBtn.triggerEventHandler('click', null);
    fixture.detectChanges();

    // which should open the modal
    expect(fixture.nativeElement.querySelector('.modal')).toBeTruthy();
    expect(component.filenameModalOpen).toBe(true);

    const downloadBtn = fixture.debugElement.query(By.css('#download-btn'));

    // expect that the filename value is empty and thus that the download button is disabled
    expect(component.downloadFilename).toBe('');
    expect(fixture.debugElement.nativeElement.querySelector('#download-btn').disabled).toBe(true);

    // enter a filename
    component.downloadFilename = 'some-filename';
    fixture.detectChanges();

    // expect that the download button is now enabled
    expect(fixture.debugElement.nativeElement.querySelector('#download-btn').disabled).toBe(false);

    // click the download button
    downloadBtn.triggerEventHandler('click', null);
    fixture.detectChanges();

    // expect that the downloading functions have been called and that the modal is closed, filename reset
    expect(spyOnSetObjectAttributes).toHaveBeenCalled();
    expect(spyOnDownloader).toHaveBeenCalled();
    expect(component.filenameModalOpen).toBe(false);
    expect(component.downloadFilename).toBe('');
  });

  it('can toggle gene symbols', () => {
    component.render();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.reference-gene-symbol').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.comparison-gene-symbol').length).toBe(0);

    component.options.symbols = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.reference-gene-symbol').length).toBe(5);
    expect(fixture.nativeElement.querySelectorAll('.comparison-gene-symbol').length).toBe(5);

    component.options.symbols = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.reference-gene-symbol').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.comparison-gene-symbol').length).toBe(0);
  });

  it('can toggle gene anchors', () => {
    component.render();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('#gene-anchors path').length).toBe(0);

    component.options.anchors = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('#gene-anchors path').length).toBe(4);

    component.options.anchors = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('#gene-anchors path').length).toBe(0);
  });

  it('can toggle true and matching orientation', () => {
    component.render();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('#orientation-indicators g').length).toBe(17);
    // the first block in chr 1 has unmatched orientation
    expect(component.blocks[0].getBlockCompStartLabel(component.options.trueOrientation)).toBe('8:55,526,155bp');
    expect(component.blocks[0].getBlockCompEndLabel(component.options.trueOrientation)).toBe('8:49,909,726bp');

    component.options.trueOrientation = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('#orientation-indicators g').length).toBe(0);
    // check that the labels have switched
    expect(component.blocks[0].getBlockCompStartLabel(component.options.trueOrientation)).toBe('8:49,909,726bp');
    expect(component.blocks[0].getBlockCompEndLabel(component.options.trueOrientation)).toBe('8:55,526,155bp');

    component.options.trueOrientation = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('#orientation-indicators g').length).toBe(17);
    expect(component.blocks[0].getBlockCompStartLabel(component.options.trueOrientation)).toBe('8:55,526,155bp');
    expect(component.blocks[0].getBlockCompEndLabel(component.options.trueOrientation)).toBe('8:49,909,726bp');
  });

  it('can toggle GWAS', () => {
    component.render();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.human-gwas').length).toBe(42);
    expect(fixture.nativeElement.querySelectorAll('.human-gwas-handle').length).toBe(42);

    component.options.GWAS = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.human-gwas').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.human-gwas-handle').length).toBe(0);

    component.options.GWAS = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.human-gwas').length).toBe(42);
    expect(fixture.nativeElement.querySelectorAll('.human-gwas-handle').length).toBe(42);
  });

  it('translates to specified coordinates', () => {
    expect(component.translate([0, 0])).toBe('translate(0, 0)');
    expect(component.translate([-222, 0])).toBe('translate(-222, 0)');
    expect(component.translate([0, 67])).toBe('translate(0, 67)');
    expect(component.translate([0, 0.44])).toBe('translate(0, 0.44)');
  });

  it('highlights reference gene with no homologs', () => {
    component.render();
    component.highlightRefGene(component.refGenes[4]);

    expect(component.refGenes.filter(g => g.highlighted).length).toBe(1);
    expect(component.compGenes.filter(g => g.highlighted).length).toBe(0);

    component.unhighlightGene();

    expect(component.refGenes.filter(g => g.highlighted).length).toBe(0);
    expect(component.compGenes.filter(g => g.highlighted).length).toBe(0);
  });

  it('highlights reference gene with one homolog', () => {
    component.render();
    component.highlightRefGene(component.refGenes[2]);

    expect(component.refGenes.filter(g => g.highlighted).length).toBe(1);
    expect(component.compGenes.filter(g => g.highlighted).length).toBe(1);

    component.unhighlightGene();

    expect(component.refGenes.filter(g => g.highlighted).length).toBe(0);
    expect(component.compGenes.filter(g => g.highlighted).length).toBe(0);
  });

  it('highlights reference gene with multiple homologs', () => {
    component.render();
    component.highlightRefGene(component.refGenes[1]);

    expect(component.refGenes.filter(g => g.highlighted).length).toBe(1);
    expect(component.compGenes.filter(g => g.highlighted).length).toBe(2);

    component.unhighlightGene();

    expect(component.refGenes.filter(g => g.highlighted).length).toBe(0);
    expect(component.compGenes.filter(g => g.highlighted).length).toBe(0);
  });

  it('highlights comparison gene and its homolog', () => {
    component.render();
    component.highlightCompGene(component.compGenes[2]);

    expect(component.compGenes.filter(g => g.highlighted).length).toBe(1);
    expect(component.refGenes.filter(g => g.highlighted).length).toBe(1);

    component.unhighlightGene();

    expect(component.compGenes.filter(g => g.highlighted).length).toBe(0);
    expect(component.refGenes.filter(g => g.highlighted).length).toBe(0);
  });

  it('filters genes that match highlighting filters', () => {
    component.render();

    expect(component.filteredRefGenes.length).toBe(0);
    expect(component.filteredCompGenes.length).toBe(0);

    const filteredGenes = [component.refGenes[1],component.refGenes[2],component.compGenes[2]]
    filteredGenes.forEach(g => g.filter());

    component.showFilteredGenes(filteredGenes);
    fixture.detectChanges();

    expect(component.filteredRefGenes.length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.ref-filtered-ind').length).toBe(2);
    expect(component.filteredCompGenes.length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.comp-filtered-ind').length).toBe(1);
  });

  it('shows clicktip data for a reference gene', () => {
    component.render();

    expect(component.clicktip).toBeFalsy();
    expect(component.clicktipOpen).toBe(false);

    component.showDataForGene(component.refGenes[0]);

    expect(component.clicktipOpen).toBe(true);
    expect(component.clicktip.title).toBe('Disp1');
    expect(component.clicktip.id).toBe('MGI:1916147');
    expect(component.clicktip.content)
      .toEqual({'Gene Symbol': 'Disp1', 'Gene ID': 'MGI:1916147', Type: 'protein coding gene', Location: 'Chr1: 183,086,266bp - 183,221,522bp', Strand: '-1'});
    expect(component.clicktip.resources)
      .toEqual([{url: 'http://www.informatics.jax.org/marker/', name: 'MGI'}]);
  });

  it('shows clicktip data for a comparison gene', () => {
    component.render();

    expect(component.clicktip).toBeFalsy();
    expect(component.clicktipOpen).toBe(false);

    component.showDataForGene(component.compGenes[0]);

    expect(component.clicktipOpen).toBe(true);
    expect(component.clicktip.title).toBe('DISP1');
    expect(component.clicktip.id).toBe('84976');
    expect(component.clicktip.content)
      .toEqual({'Gene Symbol': 'DISP1', 'Gene ID': '84976', Type: 'gene', Location: 'Chr1: 222,814,514bp - 223,005,995bp', Strand: '1'});
    expect(component.clicktip.resources)
      .toEqual([{url: 'https://www.ncbi.nlm.nih.gov/gene/', name: 'NCBI'}]);
  });

  it('shows clicktip data for a GWAS location', () => {
    component.render();

    expect(component.clicktip).toBeFalsy();
    expect(component.clicktipOpen).toBe(false);

    component.showDataForHitLocation(component.humanGWAS[3]);

    expect(component.clicktipOpen).toBe(true);
    expect(component.clicktip.title).toBe('Chr2: 226,229,029bp');
    expect(component.clicktip.hits.length).toBe(1);
  });

  it('can get genome blocks', () => {
    component.render();

    expect(component.getGenomeBlocks().length).toBe(42);
  });

  it('can position chromosome labels correctly', () => {
    component.render();

    expect(component.getChrLabelPos('1')).toBe('translate(37.29393797414988, 13.5)');
    expect(component.getChrLabelPos('5')).toBe('translate(28.968415565936283, 13.5)');
  });

  it('renders only reference genes in view', () => {
    component.render();
    component.jumpToInterval([90874118, 113142630]);

    expect(component.getRefGenesInView().length).toBe(3);
  });

  it('renders no reference genes if all are out of view', () => {
    component.render();
    component.jumpToInterval([80000000, 84000000]);

    expect(component.getRefGenesInView().length).toBe(0);
  });

  it('renders a reference gene that starts after interval start and ends before interval end', () => {
    component.render();
    component.jumpToInterval([93780627, 95441846]);

    expect(component.getRefGenesInView().length).toBe(1);
  });

  it('renders a reference gene that starts before interval start and ends before interval end', () => {
    component.render();
    component.jumpToInterval([93800000, 95441846]);

    expect(component.getRefGenesInView().length).toBe(1);
  });

  it('renders a reference gene that starts at interval start and ends before interval end', () => {
    component.render();
    component.jumpToInterval([93792576, 95441846]);

    expect(component.getRefGenesInView().length).toBe(1);
  });

  it('renders a reference gene that starts at interval start and ends at interval end', () => {
    component.render();
    component.jumpToInterval([93792576, 93801934]);

    expect(component.getRefGenesInView().length).toBe(1);
  });

  it('renders a reference gene that starts after interval start and ends at interval end', () => {
    component.render();
    component.jumpToInterval([93692576, 93801934]);

    expect(component.getRefGenesInView().length).toBe(1);
  });

  it('renders a reference gene that starts after interval start and ends after interval end', () => {
    component.render();
    component.jumpToInterval([93692576, 93801834]);

    expect(component.getRefGenesInView().length).toBe(1);
  });

  it('renders a reference gene that starts before interval start and ends after interval end', () => {
    component.render();
    component.jumpToInterval([106180000, 106200000]);

    expect(component.getRefGenesInView().length).toBe(1);
  });

  // comp genes w/ matching orientation
  it('renders only comparison genes in view (matching orientation)', () => {
    component.render();
    // remember that jumping to an interval is utilizing reference chromosome coordinates, not comparison
    component.jumpToInterval([90874118, 113142630]);

    expect(component.getCompGenesInView().length).toBe(2);
  });

  it('renders no comparison genes if all are out of view (matching orientation)', () => {
    component.render();
    component.jumpToInterval([80000000, 84000000]);

    expect(component.getCompGenesInView().length).toBe(0);
  });

  it('renders a comparison gene that starts after interval start and ends before interval end (matching orientation)', () => {
    component.render();
    component.jumpToInterval([183188070, 183352234]);

    expect(component.getCompGenesInView().length).toBe(1);
  });

  it('renders a comparison gene that starts before interval start and ends before interval end (matching orientation)', () => {
    component.render();
    component.jumpToInterval([183200108, 183364271]);

    expect(component.getCompGenesInView().length).toBe(1);
  });

  it('renders a comparison gene that starts at interval start and ends before interval end (matching orientation)', () => {
    component.render();
    const compScale = component.getScale(component.compGenes[0]);
    const refStart = component.refBPToPixels.invert(compScale(222814514));
    component.jumpToInterval([refStart, 183364271]);

    expect(component.getCompGenesInView().length).toBe(1);
  });

  it('renders a comparison gene that starts at interval start and ends at interval end (matching orientation)', () => {
    component.render();
    const compScale = component.getScale(component.compGenes[0]);
    const refStart = component.refBPToPixels.invert(compScale(222814514));
    const refEnd = component.refBPToPixels.invert(compScale(223005995));
    component.jumpToInterval([refStart, refEnd]);

    expect(component.getCompGenesInView().length).toBe(1);
  });

  it('renders a comparison gene that starts after interval start and ends at interval end (matching orientation)', () => {
    component.render();
    const compScale = component.getScale(component.compGenes[0]);
    const refEnd = component.refBPToPixels.invert(compScale(223005995));
    component.jumpToInterval([183188070, refEnd]);

    expect(component.getCompGenesInView().length).toBe(1);
  });

  it('renders a comparison gene that starts after interval start and ends after interval end (matching orientation)', () => {
    component.render();
    component.jumpToInterval([183188070, 183322184]);

    expect(component.getCompGenesInView().length).toBe(1);
  });

  it('renders a comparison gene that starts before interval start and ends after interval end (matching orientation)', () => {
    component.render();
    component.jumpToInterval([183194712, 183311601]);

    expect(component.getCompGenesInView().length).toBe(1);
  });

  // comp genes w/ true orientation
  it('renders only comparison genes in view (true orientation)', () => {
    component.render();
    component.options.trueOrientation = true;
    component.jumpToInterval([90874118, 113142630]);

    expect(component.getCompGenesInView().length).toBe(2);
  });

  it('renders no comparison genes if all are out of view (true orientation)', () => {
    component.render();
    component.options.trueOrientation = true;
    component.jumpToInterval([80000000, 84000000]);

    expect(component.getCompGenesInView().length).toBe(0);
  });

  it('renders a comparison gene that starts after interval start and ends before interval end (true orientation)', () => {
    component.render();
    component.options.trueOrientation = true;
    component.jumpToInterval([194095611, 194294110]);

    expect(component.getCompGenesInView().length).toBe(1);
  });

  it('renders a comparison gene that starts before interval start and ends before interval end (true orientation)', () => {
    component.render();
    component.options.trueOrientation = true;
    component.jumpToInterval([194119114, 194279676]);

    expect(component.getCompGenesInView().length).toBe(1);
  });

  it('renders a comparison gene that starts at interval start and ends before interval end (true orientation)', () => {
    component.render();
    component.options.trueOrientation = true;
    const compScale = component.getScale(component.compGenes[0]);
    const refStart = component.refBPToPixels.invert(compScale(222814514));
    component.jumpToInterval([refStart, 183364271]);

    expect(component.getCompGenesInView().length).toBe(1);
  });

  it('renders a comparison gene that starts at interval start and ends at interval end (true orientation)', () => {
    component.render();
    component.options.trueOrientation = true;
    const compScale = component.getScale(component.compGenes[0]);
    const refStart = component.refBPToPixels.invert(compScale(222814514));
    const refEnd = component.refBPToPixels.invert(compScale(223005995));
    component.jumpToInterval([refStart, refEnd]);

    expect(component.getCompGenesInView().length).toBe(1);
  });

  it('renders a comparison gene that starts after interval start and ends at interval end (true orientation)', () => {
    component.render();
    component.options.trueOrientation = true;
    const compScale = component.getScale(component.compGenes[0]);
    const refEnd = component.refBPToPixels.invert(compScale(223005995));
    component.jumpToInterval([183188070, refEnd]);

    expect(component.getCompGenesInView().length).toBe(1);
  });

  it('renders a comparison gene that starts after interval start and ends after interval end (true orientation)', () => {
    component.render();
    component.options.trueOrientation = true;
    component.jumpToInterval([194089724, 194250286]);

    expect(component.getCompGenesInView().length).toBe(1);
  });

  it('renders a comparison gene that starts before interval start and ends after interval end (true orientation)', () => {
    component.render();
    component.options.trueOrientation = true;
    component.jumpToInterval([194116640, 194189699]);

    expect(component.getCompGenesInView().length).toBe(1);
  });

  it('renders a comparison gene that is within view and then does not if it no longer is in view after orientation toggles', () => {
    component.render();
    component.jumpToInterval([183188070, 183322184]);

    expect(component.getCompGenesInView().length).toBe(1);

    component.options.trueOrientation = true;

    expect(component.getCompGenesInView().length).toBe(0);

    component.jumpToInterval([194116640, 194189699]);

    expect(component.getCompGenesInView().length).toBe(1);

    component.options.trueOrientation = false;

    expect(component.getCompGenesInView().length).toBe(0);
  });

  it('gets all reference genes with homologs', () => {
    component.render();

    expect(component.getHomologousRefGenes().length).toBe(4);
  });

  it('gets the correct comparison scale for a gene in a matching orientation sytenic block', () => {
    component.render();

    let scale = component.getScale(component.compGenes[3]);

    expect(scale.domain()).toEqual([61333582, 67516730]);
    expect(scale.range()).toEqual([642.6384986981075, 686.1650598591447]);

    component.options.trueOrientation = true;
    scale = component.getScale(component.compGenes[3]);

    expect(scale.domain()).toEqual([61333582, 67516730]);
    expect(scale.range()).toEqual([642.6384986981075, 686.1650598591447]);
  });

  it('gets the correct comparison scale for a gene in a non-matching orientation sytenic block', () => {
    component.render();

    let scale = component.getScale(component.compGenes[0]);

    expect(scale.domain()).toEqual([224193441, 207454300]);
    expect(scale.range()).toEqual([1118.0561955350622, 1197.188943697713]);

    component.options.trueOrientation = true;
    scale = component.getScale(component.compGenes[0]);

    // check that the domain has changed but the range remains the same
    expect(scale.domain()).toEqual([207454300, 224193441]);
    expect(scale.range()).toEqual([1118.0561955350622, 1197.188943697713]);
  });

  it('gets the correct static comparison scale for a gene in a matching orientation sytenic block', () => {
    component.render();

    let scale = component.getStaticCompScale(component.compGenes[3]);

    expect(scale.domain()).toEqual([61333582, 67516730]);
    expect(scale.range()).toEqual([642.6384986981075, 686.1650598591447]);

    component.options.trueOrientation = true;
    scale = component.getStaticCompScale(component.compGenes[3]);

    expect(scale.domain()).toEqual([61333582, 67516730]);
    expect(scale.range()).toEqual([642.6384986981075, 686.1650598591447]);

    component.jumpToInterval([194119114, 194279676]);

    expect(scale.domain()).toEqual([61333582, 67516730]);
    expect(scale.range()).toEqual([642.6384986981075, 686.1650598591447]);
  });

  it('gets the correct static comparison scale for a gene in a non-matching orientation sytenic block', () => {
    component.render();

    let scale = component.getStaticCompScale(component.compGenes[0]);

    expect(scale.domain()).toEqual([224193441, 207454300]);
    expect(scale.range()).toEqual([1118.0561955350622, 1197.188943697713]);

    component.options.trueOrientation = true;
    scale = component.getStaticCompScale(component.compGenes[0]);

    // check that the domain has changed but the range remains the same
    expect(scale.domain()).toEqual([207454300, 224193441]);
    expect(scale.range()).toEqual([1118.0561955350622, 1197.188943697713]);

    component.jumpToInterval([194119114, 194279676]);

    expect(scale.domain()).toEqual([207454300, 224193441]);
    expect(scale.range()).toEqual([1118.0561955350622, 1197.188943697713]);
  });

  it('gets the correct comparison scale for a GWAS location in a matching orientation sytenic block', () => {
    component.render();

    let scale = component.getScale(component.humanGWAS[4]);

    expect(scale.domain()).toEqual([132415972, 137677712]);
    expect(scale.range()).toEqual([770.8865748532305, 798.7483500741905]);

    component.options.trueOrientation = true;
    scale = component.getScale(component.humanGWAS[4]);

    expect(scale.domain()).toEqual([132415972, 137677712]);
    expect(scale.range()).toEqual([770.8865748532305, 798.7483500741905]);
  });

  it('gets the correct comparison scale for a GWAS location in a non-matching orientation sytenic block', () => {
    component.render();

    let scale = component.getScale(component.humanGWAS[20]);

    expect(scale.domain()).toEqual([73198851, 56457987]);
    expect(scale.range()).toEqual([131.25505956554764, 210.44492634189484]);

    component.options.trueOrientation = true;
    scale = component.getScale(component.humanGWAS[20]);

    // check that the domain has changed but the range remains the same
    expect(scale.domain()).toEqual([56457987, 73198851]);
    expect(scale.range()).toEqual([131.25505956554764, 210.44492634189484]);
  });

  it('gets the reference chromosome', () => {
    component.render();

    expect(component.getRefChrSize()).toBe(195471971)
  });

  it('gets a vertical line path', () => {
    expect(component.getVLinePath(0, 5)).toBe('M0,0L0,5Z');
    expect(component.getVLinePath(-8, 65, 9)).toBe('M-8,9L-8,74Z');
    expect(component.getVLinePath(3, -10, 0)).toBe('M3,0L3,-10Z');
  });

  it('gets a horizontal line path', () => {
    expect(component.getHLinePath(0, 5)).toBe('M0,0L5,0Z');
    expect(component.getHLinePath(-8, 65, 9)).toBe('M9,-8L74,-8Z');
    expect(component.getHLinePath(3, -10, 0)).toBe('M0,3L-10,3Z');
  });

  it('gets syntenic blocks with mismatched orientation', () => {
    component.render();

    expect(component.getNonMatchedBlocks().length).toBe(17);
  });

  it('gets anchor path for gene with single homolog', () => {
    component.render();

    expect(component.getAnchorPathCommand(component.refGenes[0]))
      .toBe('M1123.0276740494933,25.890576417125082V80L1123.6697371902014,110V153.76445029099895M1123.8573170063344,25.890576417125082V80L1124.5749459909953,110V153.76445029099895');
  });

  it('gets anchor path for gene with multiple homologs', () => {
    component.render();

    expect(component.getAnchorPathCommand(component.refGenes[1]))
      .toBe('M60.100331688986756,14.431116957665623V80L59.94799702020832,110V156.5031890297377M60.730513404400064,14.431116957665623V80L61.08754062844289,110V156.5031890297377M60.100331688986756,14.431116957665623V80L60.21090010822731,110V146.84553137208005M60.730513404400064,14.431116957665623V80L61.08754062844289,110V146.84553137208005');
  });
});

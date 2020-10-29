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

fdescribe('BlockViewBrowserComponent', () => {
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

    expect(component.interval.refStart).toBe(180586266);
    expect(component.interval.refEnd).toBe(185721522);
  });

  it('should show selected QTLs', () => {
    component.data.features.features = SELECTED_QTL_FEATURES;
    component.render();

    expect(component.selectedRefGenes.length).toBe(0);
    expect(component.selectedCompGenes.length).toBe(0);
    expect(component.selectedQTLs.length).toBe(2);

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
});

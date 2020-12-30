import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { DeviceDetectorService } from 'ngx-device-detector';
import { AppComponent } from './app.component';

export class MockDeviceDetectorService {}

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, FormsModule, ClarityModule],
      declarations: [AppComponent],
      providers: [{ provide: DeviceDetectorService, useClass: MockDeviceDetectorService }],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have 4 pages', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.pages.length).toBe(4);
  });

  it('should render the header and navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.branding')).toBeTruthy();
    expect(compiled.querySelectorAll('.nav-link').length).toBe(4);
  });
});

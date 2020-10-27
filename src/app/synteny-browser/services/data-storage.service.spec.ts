import { TestBed } from '@angular/core/testing';

import { DataStorageService } from './data-storage.service';
import { ApiService } from './api.service';
import { MockApiService } from '../testing/mock-api.service';

describe('DataStorageService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      { provide: ApiService, useClass: MockApiService }
    ],
  }));

  it('should be created', () => {
    const service: DataStorageService = TestBed.get(DataStorageService);
    expect(service).toBeTruthy();
  });
});

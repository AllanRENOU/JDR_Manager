import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SoundLibraryPage } from './sound-library-page';

describe('SoundLibraryPage', () => {
  let component: SoundLibraryPage;
  let fixture: ComponentFixture<SoundLibraryPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoundLibraryPage],
    }).compileComponents();

    fixture = TestBed.createComponent(SoundLibraryPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

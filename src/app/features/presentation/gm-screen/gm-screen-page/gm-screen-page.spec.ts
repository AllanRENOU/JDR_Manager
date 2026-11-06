import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GmScreenPage } from './gm-screen-page';

describe('GmScreenPage', () => {
  let component: GmScreenPage;
  let fixture: ComponentFixture<GmScreenPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GmScreenPage],
    }).compileComponents();

    fixture = TestBed.createComponent(GmScreenPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

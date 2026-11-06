import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerScreenPage } from './player-screen-page';

describe('PlayerScreenPage', () => {
  let component: PlayerScreenPage;
  let fixture: ComponentFixture<PlayerScreenPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerScreenPage],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerScreenPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

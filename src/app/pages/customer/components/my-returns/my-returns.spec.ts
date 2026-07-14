import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MyReturns } from "./my-returns";

describe("MyReturns", () => {
  let component: MyReturns;
  let fixture: ComponentFixture<MyReturns>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyReturns],
    }).compileComponents();

    fixture = TestBed.createComponent(MyReturns);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});

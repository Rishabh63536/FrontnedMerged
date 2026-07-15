import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DummyPaymentComponent as DummyPayment } from "./dummy-payment";

describe("DummyPayment", () => {
  let component: DummyPayment;
  let fixture: ComponentFixture<DummyPayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DummyPayment],
    }).compileComponents();

    fixture = TestBed.createComponent(DummyPayment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});

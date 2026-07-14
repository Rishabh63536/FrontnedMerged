import { TestBed } from "@angular/core/testing";

import { ReturnRequests } from "./return-requests";

describe("ReturnRequests", () => {
  let service: ReturnRequests;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReturnRequests);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});

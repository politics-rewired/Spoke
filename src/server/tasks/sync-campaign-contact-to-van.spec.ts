import {
  CanvassResultRow,
  formatCanvassResponsePayload,
  hasPayload,
  VANCanvassResponse
} from "./sync-campaign-contact-to-van";

describe("fetchSyncQueries", () => {
  // TODO: write tests once Spoke is set up to run with a test database
  test("fetches correct database records for VAN sync");
});

describe("formatCanvassResponsePayload", () => {
  const phoneId = 5432;
  const canvassedResultCode = 1234;

  test("correctly formats an opted-out contact without survey responses", () => {
    const optOutResultCode = 4321;

    const canvassResultRow: CanvassResultRow = {
      canvassed_at: "2021-01-21",
      result_codes: [],
      activist_codes: [],
      response_options: []
    };
    const canvassResponse = formatCanvassResponsePayload({
      canvassResultRow,
      phoneId,
      canvassedResultCode,
      optOutResultCode
    });
    expect(canvassResponse.responses).toBeNull();
    expect(canvassResponse.resultCodeId).toBe(optOutResultCode);
  });

  test("correctly formats a messaged contact without survey responses", () => {
    const optOutResultCode = null;

    const canvassResultRow: CanvassResultRow = {
      canvassed_at: "2021-01-21",
      result_codes: [],
      activist_codes: [],
      response_options: []
    };
    const canvassResponse = formatCanvassResponsePayload({
      canvassResultRow,
      phoneId,
      canvassedResultCode,
      optOutResultCode
    });
    expect(canvassResponse.responses).toBeNull();
    expect(canvassResponse.resultCodeId).toBe(canvassedResultCode);
  });

  test("correctly formats a contact with both survey responses and a canvass result code", () => {
    const optOutResultCode = null;

    const canvassResultRow: CanvassResultRow = {
      canvassed_at: "2021-01-21",
      result_codes: [{ result_code_id: 777 }],
      activist_codes: [],
      response_options: [{ survey_question_id: 999, response_option_id: 888 }]
    };
    const canvassResponse = formatCanvassResponsePayload({
      canvassResultRow,
      phoneId,
      canvassedResultCode,
      optOutResultCode
    });
    expect(canvassResponse.responses).toHaveLength(1);
    expect(canvassResponse.resultCodeId).toBeNull();
  });
});

describe("hasPayload", () => {
  test("returns false for empty responses", () => {
    const nullResponsesResponse: VANCanvassResponse = {
      canvassContext: {
        phoneId: 1234,
        dateCanvassed: "2021-01-21"
      },
      resultCodeId: null,
      responses: null
    };
    expect(hasPayload(nullResponsesResponse)).toBe(false);

    const emptyResponsesResponse: VANCanvassResponse = {
      canvassContext: {
        phoneId: 1234,
        dateCanvassed: "2021-01-21"
      },
      resultCodeId: null,
      responses: []
    };
    expect(hasPayload(emptyResponsesResponse)).toBe(false);
  });

  test("returns true for canvass response with result code", () => {
    const resultCodeResponse: VANCanvassResponse = {
      canvassContext: {
        phoneId: 1234,
        dateCanvassed: "2021-01-21"
      },
      resultCodeId: 5432,
      responses: null
    };
    expect(hasPayload(resultCodeResponse)).toBe(true);
  });

  test("returns true for canvass response with responses", () => {
    const resultCodeResponse: VANCanvassResponse = {
      canvassContext: {
        phoneId: 1234,
        dateCanvassed: "2021-01-21"
      },
      resultCodeId: null,
      responses: [
        { type: "ActivistCode", activistCodeId: 1234, action: "Apply" }
      ]
    };
    expect(hasPayload(resultCodeResponse)).toBe(true);
  });
});

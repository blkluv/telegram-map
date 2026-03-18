import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateForm,
  formDataToJson,
  submitToApi,
  displayResult,
  resetFormAfterSubmission,
  handleFormSubmit,
  initializeContactForm,
  type ContactForm,
  type FormSubmissionResult,
} from "./contactFormHandler";

// Helper to create a mock form
function createMockForm(isValid: boolean = true): ContactForm {
  const form = document.createElement("form") as ContactForm;
  form.id = "test-form";

  // Mock checkValidity
  form.checkValidity = vi.fn(() => isValid);

  // Mock classList
  const classList = {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
  };
  Object.defineProperty(form, "classList", {
    value: classList,
    writable: true,
  });

  // Create a persistent invalid field for invalid forms
  const invalidField = document.createElement("input");
  invalidField.focus = vi.fn();

  // Mock querySelectorAll for invalid fields
  form.querySelectorAll = vi.fn((selector: string) => {
    if (selector === ":invalid" && !isValid) {
      return [invalidField];
    }
    return [];
  });

  // Mock reset
  form.reset = vi.fn();

  // Add mock form elements
  const nameInput = document.createElement("input");
  nameInput.name = "name";
  nameInput.value = "John Doe";

  const emailInput = document.createElement("input");
  emailInput.name = "email";
  emailInput.type = "email";
  emailInput.value = "john@example.com";

  const messageInput = document.createElement("textarea");
  messageInput.name = "message";
  messageInput.value = "Test message";

  const botcheckInput = document.createElement("input");
  botcheckInput.name = "botcheck";
  botcheckInput.type = "checkbox";

  const accessKeyInput = document.createElement("input");
  accessKeyInput.name = "access_key";
  accessKeyInput.type = "hidden";
  accessKeyInput.value = "test-key";

  form.appendChild(nameInput);
  form.appendChild(emailInput);
  form.appendChild(messageInput);
  form.appendChild(botcheckInput);
  form.appendChild(accessKeyInput);

  return form;
}

// Helper to create a mock result element
function createMockResultElement(): HTMLElement {
  const element = document.createElement("div");
  element.id = "result";
  const classList = {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
  };
  Object.defineProperty(element, "classList", {
    value: classList,
    writable: true,
  });
  return element;
}

describe("contactFormHandler", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Setup fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validateForm", () => {
    it("should return true for a valid form", () => {
      const form = createMockForm(true);
      const result = validateForm(form);

      expect(result).toBe(true);
      expect(form.classList.add).toHaveBeenCalledWith("was-validated");
      expect(form.checkValidity).toHaveBeenCalled();
    });

    it("should return false for an invalid form", () => {
      const form = createMockForm(false);
      const result = validateForm(form);

      expect(result).toBe(false);
      expect(form.classList.add).toHaveBeenCalledWith("was-validated");
    });

    it("should focus the first invalid field when form is invalid", () => {
      const form = createMockForm(false);
      validateForm(form);

      const invalidFields = form.querySelectorAll(":invalid");
      expect(invalidFields[0].focus).toHaveBeenCalled();
    });
  });

  describe("formDataToJson", () => {
    it("should convert FormData to JSON string", () => {
      const formData = new FormData();
      formData.append("name", "John Doe");
      formData.append("email", "john@example.com");
      formData.append("message", "Hello world");

      const json = formDataToJson(formData);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual({
        name: "John Doe",
        email: "john@example.com",
        message: "Hello world",
      });
    });

    it("should handle empty FormData", () => {
      const formData = new FormData();
      const json = formDataToJson(formData);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual({});
    });
  });

  describe("submitToApi", () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it("should submit data and return success result", async () => {
      const mockResponse = {
        status: 200,
        json: async () => ({ message: "Success!" }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const json = JSON.stringify({ name: "John" });
      const result = await submitToApi(json);

      expect(result).toEqual({
        success: true,
        message: "Success!",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.web3forms.com/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: json,
        }
      );
    });

    it("should handle error response", async () => {
      const mockResponse = {
        status: 400,
        json: async () => ({ message: "Invalid data" }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const json = JSON.stringify({ name: "John" });
      const result = await submitToApi(json);

      expect(result).toEqual({
        success: false,
        message: "Invalid data",
      });
    });

    it("should use custom API URL when provided", async () => {
      const mockResponse = {
        status: 200,
        json: async () => ({ message: "Success!" }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const customUrl = "https://custom-api.com/submit";
      await submitToApi("{}", customUrl);

      expect(global.fetch).toHaveBeenCalledWith(
        customUrl,
        expect.any(Object)
      );
    });

    it("should handle missing message in response", async () => {
      const mockResponse = {
        status: 200,
        json: async () => ({}),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await submitToApi("{}");

      expect(result.message).toBe("Unknown error occurred");
    });
  });

  describe("displayResult", () => {
    it("should display success message", () => {
      const element = createMockResultElement();
      const result: FormSubmissionResult = {
        success: true,
        message: "Form submitted successfully!",
      };

      displayResult(element, result);

      expect(element.classList.remove).toHaveBeenCalledWith(
        "text-success",
        "text-error"
      );
      expect(element.classList.add).toHaveBeenCalledWith("text-success");
      expect(element.innerHTML).toBe("Form submitted successfully!");
    });

    it("should display error message", () => {
      const element = createMockResultElement();
      const result: FormSubmissionResult = {
        success: false,
        message: "Submission failed",
      };

      displayResult(element, result);

      expect(element.classList.remove).toHaveBeenCalledWith(
        "text-success",
        "text-error"
      );
      expect(element.classList.add).toHaveBeenCalledWith("text-error");
      expect(element.innerHTML).toBe("Submission failed");
    });
  });

  describe("resetFormAfterSubmission", () => {
    it("should reset form and hide result after delay", () => {
      const form = createMockForm();
      const resultElement = createMockResultElement();

      resetFormAfterSubmission(form, resultElement, 5000);

      expect(form.reset).toHaveBeenCalled();
      expect(form.classList.remove).toHaveBeenCalledWith("was-validated");

      // Fast-forward time
      vi.advanceTimersByTime(5000);

      expect(resultElement.style.display).toBe("none");
    });

    it("should use custom delay", () => {
      const form = createMockForm();
      const resultElement = createMockResultElement();

      resetFormAfterSubmission(form, resultElement, 3000);

      // Should not hide before delay
      vi.advanceTimersByTime(2999);
      expect(resultElement.style.display).not.toBe("none");

      // Should hide after delay
      vi.advanceTimersByTime(1);
      expect(resultElement.style.display).toBe("none");
    });
  });

  describe("handleFormSubmit", () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it("should handle successful form submission", async () => {
      const form = createMockForm(true);
      const resultElement = createMockResultElement();
      const event = new Event("submit");

      const mockResponse = {
        status: 200,
        json: async () => ({ message: "Success!" }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      event.preventDefault = vi.fn();

      await handleFormSubmit(event, form, resultElement);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(resultElement.innerHTML).toBe("Success!");
      expect(form.reset).toHaveBeenCalled();
    });

    it("should not submit if form is invalid", async () => {
      const form = createMockForm(false);
      const resultElement = createMockResultElement();
      const event = new Event("submit");

      event.preventDefault = vi.fn();

      await handleFormSubmit(event, form, resultElement);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle network errors", async () => {
      const form = createMockForm(true);
      const resultElement = createMockResultElement();
      const event = new Event("submit");

      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      event.preventDefault = vi.fn();

      await handleFormSubmit(event, form, resultElement);

      expect(resultElement.innerHTML).toBe("Something went wrong!");
      expect(form.reset).toHaveBeenCalled();
    });

    it("should show loading state during submission", async () => {
      const form = createMockForm(true);
      const resultElement = createMockResultElement();
      const event = new Event("submit");

      const mockResponse = {
        status: 200,
        json: async () => ({ message: "Success!" }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      event.preventDefault = vi.fn();

      const submitPromise = handleFormSubmit(event, form, resultElement);

      // Check loading state before promise resolves
      expect(resultElement.innerHTML).toBe("Sending...");
      expect(resultElement.style.display).toBe("block");

      await submitPromise;
    });
  });

  describe("initializeContactForm", () => {
    it("should attach event listener to form", () => {
      document.body.innerHTML = `
        <form id="form"></form>
        <div id="result"></div>
      `;

      const form = document.getElementById("form") as HTMLFormElement;
      const addEventListenerSpy = vi.spyOn(form, "addEventListener");

      initializeContactForm();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "submit",
        expect.any(Function)
      );
    });

    it("should use custom IDs when provided", () => {
      document.body.innerHTML = `
        <form id="custom-form"></form>
        <div id="custom-result"></div>
      `;

      const form = document.getElementById("custom-form") as HTMLFormElement;
      const addEventListenerSpy = vi.spyOn(form, "addEventListener");

      initializeContactForm("custom-form", "custom-result");

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "submit",
        expect.any(Function)
      );
    });

    it("should handle missing form element gracefully", () => {
      document.body.innerHTML = `<div id="result"></div>`;

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      initializeContactForm();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Contact form or result element not found"
      );
    });

    it("should handle missing result element gracefully", () => {
      document.body.innerHTML = `<form id="form"></form>`;

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      initializeContactForm();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Contact form or result element not found"
      );
    });
  });
});

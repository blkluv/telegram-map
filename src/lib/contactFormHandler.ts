export interface FormSubmissionResult {
  success: boolean;
  message: string;
}

export interface ContactFormElements extends HTMLFormControlsCollection {
  name: HTMLInputElement;
  email: HTMLInputElement;
  message: HTMLTextAreaElement;
  botcheck: HTMLInputElement;
  access_key: HTMLInputElement;
}

export interface ContactForm extends HTMLFormElement {
  readonly elements: ContactFormElements;
}

/**
 * Validates the form using HTML5 validation API
 * @param form - The form element to validate
 * @returns true if form is valid, false otherwise
 */
export function validateForm(form: ContactForm): boolean {
  form.classList.add("was-validated");

  if (!form.checkValidity()) {
    const firstInvalid = form.querySelectorAll(":invalid")[0] as HTMLElement;
    if (firstInvalid) {
      firstInvalid.focus();
    }
    return false;
  }

  return true;
}

/**
 * Converts FormData to a JSON string
 * @param formData - The FormData object from the form
 * @returns JSON string representation of form data
 */
export function formDataToJson(formData: FormData): string {
  const object = Object.fromEntries(formData);
  return JSON.stringify(object);
}

/**
 * Submits the form data to Web3Forms API
 * @param json - JSON string of form data
 * @param apiUrl - The API endpoint URL (defaults to Web3Forms)
 * @returns Promise resolving to the submission result
 */
export async function submitToApi(
  json: string,
  apiUrl: string = "https://api.web3forms.com/submit"
): Promise<FormSubmissionResult> {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: json,
  });

  const responseData = await response.json();

  return {
    success: response.status === 200,
    message: responseData.message || "Unknown error occurred",
  };
}

/**
 * Displays the result message to the user
 * @param resultElement - The DOM element to display the message in
 * @param result - The submission result containing success status and message
 */
export function displayResult(
  resultElement: HTMLElement,
  result: FormSubmissionResult
): void {
  resultElement.classList.remove("text-success", "text-error");
  resultElement.classList.add(result.success ? "text-success" : "text-error");
  resultElement.innerHTML = result.message;
}

/**
 * Resets the form and clears the result message after a delay
 * @param form - The form element to reset
 * @param resultElement - The result message element to hide
 * @param delay - Delay in milliseconds before hiding the result (default: 5000)
 */
export function resetFormAfterSubmission(
  form: ContactForm,
  resultElement: HTMLElement,
  delay: number = 5000
): void {
  form.reset();
  form.classList.remove("was-validated");

  setTimeout(() => {
    resultElement.style.display = "none";
  }, delay);
}

/**
 * Main handler for form submission
 * @param event - The form submit event
 * @param form - The form element
 * @param resultElement - The element to display result messages
 */
export async function handleFormSubmit(
  event: Event,
  form: ContactForm,
  resultElement: HTMLElement
): Promise<void> {
  event.preventDefault();

  // Validate form
  if (!validateForm(form)) {
    return;
  }

  // Prepare form data
  const formData = new FormData(form);
  const json = formDataToJson(formData);

  // Show loading state
  resultElement.innerHTML = "Sending...";
  resultElement.style.display = "block";

  try {
    // Submit to API
    const result = await submitToApi(json);

    // Display result
    displayResult(resultElement, result);

    // Reset form
    resetFormAfterSubmission(form, resultElement);
  } catch (error) {
    // Handle network errors
    console.error(error);
    displayResult(resultElement, {
      success: false,
      message: "Something went wrong!",
    });
    resetFormAfterSubmission(form, resultElement);
  }
}

/**
 * Initializes the contact form by attaching event listeners
 * @param formId - The ID of the form element (default: "form")
 * @param resultId - The ID of the result element (default: "result")
 */
export function initializeContactForm(
  formId: string = "form",
  resultId: string = "result"
): void {
  const form = document.getElementById(formId) as ContactForm | null;
  const resultElement = document.getElementById(resultId) as HTMLElement | null;

  if (!form || !resultElement) {
    console.error("Contact form or result element not found");
    return;
  }

  form.addEventListener("submit", (event) => {
    handleFormSubmit(event, form, resultElement);
  });
}

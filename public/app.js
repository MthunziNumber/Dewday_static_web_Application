const form = document.querySelector("#contact-form");
const status = document.querySelector("#form-status");
const year = document.querySelector("#year");

if (year) year.textContent = String(new Date().getFullYear());

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
    };

    const email = payload.email.toLowerCase();
    const isValid = payload.name.length >= 2 && /^(?:[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(email) && payload.message.length >= 10;

    if (!isValid) {
      status.textContent = "Please enter a valid name, email, and message.";
      status.classList.add("error");
      return;
    }

    status.textContent = "Sending your message…";
    status.classList.remove("error");
    submitButton.disabled = true;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to send message.");
      }

      form.reset();
      status.textContent = "Message sent. We’ll be in touch soon.";
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Unable to send message. Please try again.";
      status.classList.add("error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

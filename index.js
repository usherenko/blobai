const chatButton = document.getElementById("chat-button");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const statusText = document.getElementById("status-text");

chatButton.addEventListener("click", async () => {
  const message = messageInput.value;

  if (!message) return;

  messageContainer.innerHTML += `<div class="user-message">${message}</div>`;
  messageInput.value = ""; // Clear the input field

  statusText.innerHTML = "Please wait... Model is being generated.";  // Show loading text

  try {
    // Make the API request to the backend
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    if (response.ok && data.modelUrl) {
      // If the model URL is returned, display it
      statusText.innerHTML = `Model generated successfully! <a href="${data.modelUrl}" target="_blank">View the model</a>`;
    } else {
      // In case of an error or if the model is not ready yet
      statusText.innerHTML = "Oops! Something went wrong. Please try again later.";
    }
  } catch (error) {
    console.error("Error:", error);
    statusText.innerHTML = "Error: Something went wrong. Please try again later.";
  }
});

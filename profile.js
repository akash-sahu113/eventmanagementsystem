document.addEventListener("DOMContentLoaded", () => {
  fetch("http://127.0.0.1:3000/profile", {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        throw new Error(data.message);
      }
      document.getElementById("username").textContent = data.username;
      document.getElementById("email").textContent = data.email;
      document.getElementById("bio").textContent = data.bio;

      const eventsList = document.getElementById("eventsList");
      eventsList.innerHTML = data.events
        .map(
          (event) => `
            <li>
              <strong>${event.title}</strong>
              <p>${event.description}</p>
              <p>Date: ${new Date(event.event_date).toLocaleString()}</p>
              <p>Location: ${event.location}</p>
            </li>
        `
        )
        .join("");
    })
    .catch((error) => {
      console.error("Error fetching profile data:", error);
      alert("Failed to load profile data");
    });
});

function editProfile() {
  // Redirect to the profile edit page
  window.location.href = "/edit-profile.html";
}

function logout() {
  fetch("http://127.0.0.1:3000/logout", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        alert(data.message);
        localStorage.removeItem("token");
        window.location.href = "/registration.html";
      }
    })
    .catch((error) => {
      console.error("Error logging out:", error);
      alert("Failed to log out");
    });
}

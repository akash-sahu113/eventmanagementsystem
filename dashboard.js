document.addEventListener("DOMContentLoaded", () => {
  fetch("http://127.0.0.1:3000/events", {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((response) => response.json())
    .then((events) => {
      const eventsList = document.getElementById("eventsList");
      eventsList.innerHTML = events
        .map(
          (event) => `
            <div class="event">
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <p>Date: ${new Date(event.event_date).toLocaleString()}</p>
                <p>Location: ${event.location}</p>
                <button onclick="editEvent(${event.id})">Edit</button>
                <button onclick="deleteEvent(${event.id})">Delete</button>
            </div>
        `
        )
        .join("");
    })
    .catch((error) => {
      console.error("Error fetching events:", error);
      alert("Failed to load events");
    });
});

function editEvent(eventId) {
  fetch(`http://127.0.0.1:3000/events/${eventId}`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((response) => response.json())
    .then((event) => {
      document.getElementById("editEventId").value = event.id;
      document.getElementById("editTitle").value = event.title;
      document.getElementById("editDescription").value = event.description;
      document.getElementById("editDate").value = new Date(event.event_date)
        .toISOString()
        .slice(0, 16);
      document.getElementById("editLocation").value = event.location;

      document.getElementById("editEventForm").style.display = "block";
    })
    .catch((error) => {
      console.error("Error fetching event:", error);
      alert("Failed to load event data");
    });
}

function deleteEvent(eventId) {
  fetch(`http://127.0.0.1:3000/events/${eventId}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        alert(data.message);
        window.location.reload();
      }
    })
    .catch((error) => {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    });
}

function cancelEdit() {
  document.getElementById("editEventForm").style.display = "none";
}

function navigateToProfile() {
  // Redirect to the profile page
  window.location.href = "/profile.html";
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

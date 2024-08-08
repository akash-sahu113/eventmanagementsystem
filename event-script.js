document
  .getElementById("eventForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const eventDate = document.getElementById("event_date").value;
    const location = document.getElementById("location").value.trim();

    if (!title || !description || !eventDate || !location) {
      alert("All fields are required");
      return;
    }

    fetch("http://127.0.0.1:3000/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        title,
        description,
        event_date: eventDate,
        location,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          alert(data.message);
          window.location.reload();
        } else {
          alert("Event created successfully");
          window.location.reload();
        }
      })
      .catch((error) => {
        console.error("Error creating event:", error);
        alert("Failed to create event");
      });
  });

document
  .getElementById("editForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const eventId = document.getElementById("editEventId").value;
    const title = document.getElementById("editTitle").value.trim();
    const description = document.getElementById("editDescription").value.trim();
    const eventDate = document.getElementById("editDate").value;
    const location = document.getElementById("editLocation").value.trim();

    if (!title || !description || !eventDate || !location) {
      alert("All fields are required");
      return;
    }

    fetch(`http://127.0.0.1:3000/events/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        title,
        description,
        event_date: eventDate,
        location,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          alert(data.message);
          window.location.reload();
        }
      })
      .catch((error) => {
        console.error("Error updating event:", error);
        alert("Failed to update event");
      });
  });

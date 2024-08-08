document.addEventListener("DOMContentLoaded", () => {
  // Handle form submission for registration
  document
    .getElementById("registrationForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const username = document.getElementById("signupUsername").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value.trim();

      if (username === "" || email === "" || password === "") {
        alert("All fields are required");
        return;
      }

      if (!validateEmail(email)) {
        alert("Invalid email address");
        return;
      }

      if (password.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
      }

      // Send data to the backend for registration
      fetch("http://127.0.0.1:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message) {
            alert(data.message);
          } else {
            alert("Registration successful");
            // Redirect to login page
            toggleForm("login");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("An error occurred");
        });
    });

  // Handle form submission for login
  document
    .getElementById("loginForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();

      if (email === "" || password === "") {
        alert("All fields are required");
        return;
      }

      if (!validateEmail(email)) {
        alert("Invalid email address");
        return;
      }

      // Send data to the backend for login
      fetch("http://127.0.0.1:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Login response:", data); // Log the full response data

          console.log("Token received:", data.token); // Log the token
          if (data.token) {
            alert("Login successful");
            localStorage.setItem("token", data.token);
            console.log("Redirecting to dashboard.html"); // Log redirection attempt
            window.location.href = "dashboard.html";
          } else {
            alert("No token received. Login failed.");
          }

          // if (data.message) {
          //   alert(data.message);
          //   console.log("it is in if block");
          // } else {

          // }
        })

        .catch((error) => {
          console.error("Error:", error);
          alert("An error occurred");
        });
    });

  // Toggle between signup and login forms
  document.getElementById("showSignup").addEventListener("click", () => {
    toggleForm("signup");
  });

  document.getElementById("showLogin").addEventListener("click", () => {
    toggleForm("login");
  });
});

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function toggleForm(formType) {
  if (formType === "signup") {
    document.getElementById("signupForm").style.display = "block";
    document.getElementById("loginForm").style.display = "none";
  } else if (formType === "login") {
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
  }
}

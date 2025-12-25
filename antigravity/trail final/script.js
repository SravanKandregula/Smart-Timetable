let selectedRole = "Student";
document.getElementById("roleInput").value = selectedRole;

function selectRole(element) {
  document.querySelectorAll(".role").forEach(r => {
    r.classList.remove("active");
  });

  element.classList.add("active");
  selectedRole = element.innerText;

  document.getElementById("roleInput").value = selectedRole;
}

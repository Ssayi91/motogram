// Dark Mode Toggle Functionality
const darkModeToggle = document.getElementById('darkModeSwitch');
const htmlElement = document.documentElement;

// Check for saved user preference
const currentTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', currentTheme);

if (currentTheme === 'dark') {
  darkModeToggle.checked = true;
}

// Toggle dark/light mode
darkModeToggle.addEventListener('change', function() {
  if (this.checked) {
    htmlElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    htmlElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }
});
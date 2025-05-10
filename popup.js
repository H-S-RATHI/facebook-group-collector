// Group processing functions
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the AddGroup module
  if (window.AddGroup) {
    // Add event listener for add group button
    document.getElementById('add-group').addEventListener('click', () => {
      const groupUrl = document.getElementById('group-url').value.trim();
      window.AddGroup.addGroup(groupUrl);
      document.getElementById('group-url').value = '';
    });
  }
});

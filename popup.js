document.addEventListener('DOMContentLoaded', function() {
  // Initialize modules
  if (window.AddGroup && window.GroupDisplay && window.VisitGroups) {
    // Add event listener for add group button
    document.getElementById('add-group').addEventListener('click', () => {
      const groupUrl = document.getElementById('group-url').value.trim();
      window.AddGroup.addGroup(groupUrl);
      document.getElementById('group-url').value = '';
    });

    // Add group display to the DOM
    const groupDisplaySection = document.getElementById('group-display-section');
    groupDisplaySection.appendChild(window.GroupDisplay.getContainer());
  }
});

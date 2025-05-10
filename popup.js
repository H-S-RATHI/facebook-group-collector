// Group processing functions
function addGroup() {
  const groupUrl = document.getElementById('group-url').value.trim();
  if (groupUrl && groupUrl.startsWith('https://facebook.com/groups/')) {
    if (window.GroupProcessorModule.addGroup(groupUrl)) {
      alert('Group added successfully!');
      document.getElementById('group-url').value = '';
    } else {
      alert('Group already exists in the queue');
    }
  } else {
    alert('Please enter a valid Facebook group URL');
  }

}





function moTabsSelect(id) {
  var el = document.getElementById(id);
  var children = el.parentElement.children;
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    child.className = child === el ? 'tab-selected' : '';
  }
}

function moTabsClick(event) {
  var id = event.target.id;
  moTabsSelect(id);
  moTabsSelect(id + '-contents');
}

function moTabsSetup() {
  var tabs = document.querySelectorAll('.tab-navigation > *');
  for (var i = 0; i < tabs.length; i++) {
    // The addEventListener callback only runs once per named function.
    // Our setup is safe to run in a load event that may retrigger.
    tabs[i].addEventListener("click", moTabsClick);
  }
};

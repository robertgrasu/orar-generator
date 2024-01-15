document.addEventListener('DOMContentLoaded', function () {
  const dropdowns = document.querySelectorAll('.dropdown');

  dropdowns.forEach(function (dropdown) {
    let timer;
    dropdown.addEventListener('mouseenter', function () {
      clearTimeout(timer);
      const dropdownMenu = this.querySelector('.dropdown-menu');
      dropdownMenu.classList.add('show');
    });

    dropdown.addEventListener('mouseleave', function () {
      const dropdownMenu = this.querySelector('.dropdown-menu');
      timer = setTimeout(function () {
        dropdownMenu.classList.remove('show');
      }, 100); // 500 milisecunde de întârziere
    });

    dropdown.querySelector('.dropdown-toggle').addEventListener('click', function (event) {
      event.stopPropagation(); // Oprește propagarea pentru a preveni închiderea imediată a dropdown-ului
      const dropdownMenu = this.nextElementSibling;

      if (dropdownMenu.classList.contains('show')) {
        clearTimeout(timer);
        dropdownMenu.classList.remove('show');
      } else {
        dropdownMenu.classList.add('show');
      }
    });
  });

  document.addEventListener('click', function () {
    const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
    openDropdowns.forEach(function (openDropdown) {
      openDropdown.classList.remove('show');
    });
  });
});

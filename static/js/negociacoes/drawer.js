export function initDrawer() {
    const menuBtn = document.querySelector('.menu-icon');
    const overlay = document.getElementById('drawerOverlay');
    const drawer = document.getElementById('sideDrawer');
    const closeBtn = document.getElementById('closeDrawerBtn');

    function toggle() {
        drawer.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    menuBtn.addEventListener('click', toggle);
    closeBtn.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);
}